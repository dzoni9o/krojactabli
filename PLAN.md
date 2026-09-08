# Krojač tabli — plan aplikacije

> Alat za pravljenje krojnih lista: ručno unosiš delove (ploče), slažeš ih u
> prostoru u gotov komad, a aplikacija izbacuje krojnu listu i raspored rezova
> po tablama.

**Status:** planiranje · **Verzija plana:** 0.3 · **Datum:** 2026-09-07

---

## 1. Šta je ovo

Majstor zada prostoriju, ubaci gotove elemente iz kataloga (donji, viseći,
plakar, fioke, polica), prstom ih razmesti po sobi — i dobija:

1. **Krojnu listu** — koja se pravi SAMA iz elemenata, sa merama, količinom,
   materijalom i kantovanjem
2. **Raspored po tablama** — kako se delovi seku iz table 2800×2070, sa iskorišćenjem
3. **PDF/CSV izlaz** — ono što se nosi u radionicu ili šalje dobavljaču ploče

### Šta NIJE
- Nije CAD. Nije zamena za SketchUp/pCon.
- Nema okova: vođice, šarke, konfirmati. Kod fioka se generišu **samo frontovi**,
  jer kutija fioke zavisi od vođica.
- Nema CNC nestinga proizvoljnih oblika. Samo pravougaoni delovi, guillotine rez.

---

## 2. Ključne odluke (potvrđene)

| Odluka | Izbor | Posledica |
|---|---|---|
| Šta se stavlja u prostor | **Ceo element iz kataloga** | Zadaš 600×720×560 → dobiješ gotov korpus. Delovi se RAČUNAJU, ne unose |
| Prostor | **Soba sa zidovima** | Elementi se lepe za zid i jedan za drugi; zid ih zaustavlja |
| Radni prostor | **3D soba, pa krojna lista, pa raspored po tablama** | Jedan izvor podataka: elementi |
| Mašina | **Formatna testera / dobavljač** | Nesting MORA biti guillotine (rez kroz celu tablu, s kraja na kraj) |
| Unos delova | **Katalog tipova** | Donji, fioke, viseći, plakar, polica. Ručni unos ostaje samo za dodatke (radna ploča, maska, sokla) |
| Obim projekta | **Ceo prostor** (kuhinja, soba, predsoblje) | Više sklopova u projektu; nesting spaja delove SVIH sklopova po materijalu |
| Tabla | **2800 × 2070** | Default; podesivo po materijalu |
| Kerf (rez) | **3,2 mm** | Default; podesivo |
| Kantovanje | **Ne menja meru** | Kantarica prefrezuje ivicu — mera reza = gotova mera |

**Zašto je guillotine bitno:** algoritam koji „lepo popuni" tablu proizvoljnim
rasporedom daje listu koja se ne može iseći na formatnoj testeri. Svaki rez mora
ići od ivice do ivice ostatka table. Ovo je tvrdo ograničenje algoritma, ne opcija.

---

## 3. Domenski model

```
Projekat (kuhinja / soba / predsoblje)
├── Prostorija         širina × dužina × visina — zidovi za koje se lepi
├── Materijali[]       naziv, debljina, tabla, kerf, obrez, tekstura, cena/m²
├── Kantovi[]          debljina (0,4 / 1 / 2 mm), cena/m
├── Elementi[]         ← GLAVNI SADRŽAJ
│     ├── tip          donji | fioke | viseći | plakar | polica
│     ├── mere         širina × visina × dubina korpusa
│     ├── mesto        x, z u sobi · podizanje od poda · okret 0/90/180/270
│     ├── opcije       broj polica, fioka, krila; ima li front i leđa
│     └── materijali   korpus, front, leđa (svaki svoj)
└── Dodatni delovi[]   ručno, za ono što ne ispadne iz elementa
```

### 3.1 Delovi se ne unose — oni ispadaju

Iz elementa se računaju sve ploče, sa merama i mestom u sobi. Sklop korpusa je
jedan i isti, i to je jedino mesto u kodu gde se o njemu odlučuje
(`src/lib/generisi.ts`):

- **bokovi** idu spolja, preko cele visine i dubine
- **pod i plafon** staju između bokova → `širina − 2 × debljina`
- **police** su uvučene 20 mm od prednje ivice, i za debljinu leđa otpozadi
- **leđa** se uglavljuju unutar korpusa
- **front** prekriva korpus sa **2 mm zazora sa svake strane** → korpus 600×720
  daje front 596×716; fioke ga dele po visini (razmak 4 mm), krila po širini

Kantovanje ide po ulozi, ne po ploči: korpus dobija tanji kant na prednju
ivicu, front deblji unaokolo. Majstor ne klikće kantovanje na svakoj ploči.

### 3.2 Kantovanje ne menja meru
Kantarica prefrezuje ivicu ploče pre lepljenja kanta, pa kant vraća meru na
nominalnu. **Mera u listi je i mera reza.**

Kantovanje se evidentira po ivicama (L1/L2/W1/W2) jer treba za metre kanta
(nabavka, cena) i za radni nalog.

### 3.3 Lepljenje u prostoru

Vučenje prstom ne traži preciznost: kad priđeš na **9 cm**, element sedne uz
zid ili uz komšiju — bez zazora i bez preklapanja. Zid ga zaustavlja, ne može
da odleti van sobe. Kad ništa nije blizu, pozicija se zaokruži na centimetar.

Prijavljuje se ono što se u glavi ne vidi: elementi koji zauzimaju isti
prostor, i elementi koji vire iz sobe. Viseći iznad donjeg nije preklapanje —
provera gleda i visinu.

## 4. Nesting — guillotine algoritam

### Ulaz
- delovi (L × W × kom, rotacija dozvoljena/zabranjena po teksturi)
- tabla: dimenzije, **kerf** (debljina reza, default 3.2 mm), **trim** ivica (default 10 mm)

### Algoritam (v1)
Rekurzivno guillotine seckanje slobodnih pravougaonika:

1. Sortiraj delove opadajuće po većoj stranici
2. Za svaki deo nađi slobodan pravougaonik po **Best Short Side Fit**
3. Postavi deo, podeli preostali prostor **jednim rezom** (horizontalno ili
   vertikalno — izaberi split koji ostavlja povoljniji ostatak)
4. Od svakog reza oduzmi kerf
5. Nema mesta → nova tabla

### Poboljšanje (jeftino, veliki efekat)
Pokreni algoritam N puta (npr. 200) sa različitim redosledima delova i
kombinacijama split-pravila, zadrži najbolji rezultat po iskorišćenju.
**Radi u Web Workeru** da UI ne blokira.

### Izlaz
- broj tabli po materijalu
- % iskorišćenja i m² otpada po tabli
- upotrebljivi **ostaci** (npr. sve preko 200×200) — evidentirano za sledeći posao
- *(faza 2)* redosled rezova, korak po korak, za operatera na testeri

---

## 5. 3D na telefonu

Prst je debeo, ekran mali, a majstor stoji na gradilištu. Zato:

- **Dodirni element pa ga vuci po podu.** Ne postoji režim, ne postoji ručica
  za pomeranje. Element ide tamo gde ide prst.
- **Scena se ne vrti dok vučeš.** OrbitControls sluša isti pokret, pa se
  zaustavlja čim dodir krene sa ploče.
- **Tlocrt je strm kosi pogled, ne pogled pravo naniže.** Kamera koja gleda
  tačno dole nema jednoznačnu orijentaciju — vučeš desno, element ode levo.
- **Kamera kadrira nameštaj**, ne praznu sobu. Prazna soba od 4 × 3 m u kadru
  pretvara element u tačku.
- **Okretanje je dugme**, ne gest. Gest za rotaciju na dodiru se ne pogađa.

## 6. Izlazi

| Izlaz | Sadržaj |
|---|---|
| **Krojna lista (PDF)** | RB, naziv, materijal, mera reza L×W, kom, kantovanje L1/L2/W1/W2, napomena |
| **Raspored po tablama (PDF)** | crtež svake table sa numerisanim delovima, merama i % iskorišćenja |
| **Sumarno** | tabli po materijalu, m², metara kanta po tipu, procena cene |
| **CSV / XLSX** | za dobavljača ploče |
| *(v2)* **Link** | deljiva krojna lista bez instalacije |

---

## 7. Tehnički stek

Isti standard kao ostali NikVolt alati — kod i komponente se recikliraju.

- **React 19 + Vite + TypeScript**
- **Zustand** — store-ovi: `project`, `parts`, `materials`, `cutplan`, `ui`
- **react-three-fiber + drei** — 3D sklop
- **SVG** — prikaz rasporeda po tablama (lako se štampa i eksportuje u PDF)
- **Web Worker** — nesting engine, izolovan i testabilan bez UI-ja
- **Dexie / IndexedDB** — offline-first, lokalno je izvor istine
- **Supabase** — auth, projekti, katalog materijala, sync (offline → online)
- **jsPDF + autotable** — PDF izlaz
- **Vercel** — deploy
- **i18n sr / en** od prvog dana

### Dizajn
NikVolt vizuelni identitet: `#0A0A0A` pozadina, `#EAFF00` akcenat,
Space Mono + Syne, grain tekstura, grid linije, radijalni sjaj.
Mobile-first — telefon u radionici, ne laptop.

---

## 8. Faze isporuke

Svaka faza se završava demo snimkom i testiranjem sa ekipom.

| Faza | Sadržaj | Rezultat |
|---|---|---|
| **F0** | Skelet: Vite + TS + Zustand + dizajn sistem + rute + i18n | Prazna ali prava aplikacija |
| **F1** | Materijali, kantovi, krojna lista, lokalna persistencija | Lista koja se sama pravi |
| **F2** | Nesting engine (guillotine + kerf + trim + tekstura) u workeru + SVG prikaz | Vidiš raspored i iskorišćenje |
| **F3** | PDF + CSV izlaz, sumarno, kantovanje u metrima | **Upotrebljiv proizvod → demo #1** |
| **F4** | 3D soba: katalog elemenata, vučenje sa lepljenjem, provera prostora | **demo #2** |
| **F5** | Supabase: nalozi, projekti, sync offline→online, deljiv link | Radi na više uređaja |
| **F6** | Optimizacije: randomized restart, ostaci, cene, redosled rezova | Ozbiljna alatka |

**Zašto nesting (F2) pre 3D-a (F4):** unos je ručni, znači 3D nije potreban da bi
lista postojala. Već posle F3 imaš nešto što tvoja ekipa koristi na poslu i o čemu
može dati povratnu informaciju. 3D dolazi na gotov, testiran temelj.

---

## 9. Otvorena pitanja / kasnije

- **Kutije fioka** — zavise od vođica; sada se generišu samo frontovi
- **Okovi** — bušenje, konfirmati, šarke. Verovatno van opsega.
- **Ugaoni elementi** i radna ploča kao tip
- **Više soba u projektu**
- **Cenovnik ploča** — ručno ili uvoz od dobavljača
- **Odnos prema `tabla.nikvolt.com`** — deli isti PDF sloj, može zajednička biblioteka

---

## 10. Odnos prema ostalim projektima

Odlučeno: radi se ovaj projekat. `nikvolt-planner` čeka.

Kod koji se deli sa Planner-om i `tabla.nikvolt.com`: dizajn sistem, Zustand
pattern, offline-first sloj, PDF izlaz. Držati te delove čistim i prenosivim.
