# Krojač tabli — plan aplikacije

> Alat za pravljenje krojnih lista: ručno unosiš delove (ploče), slažeš ih u
> prostoru u gotov komad, a aplikacija izbacuje krojnu listu i raspored rezova
> po tablama.

**Status:** planiranje · **Verzija plana:** 0.1 · **Datum:** 2026-09-07

---

## 1. Šta je ovo

Radionica/majstor unosi delove nameštaja (bokovi, pod, plafon, police, leđa,
frontovi), slaže ih u 3D prostoru da proveri da li se sklop poklapa, i dobija:

1. **Krojnu listu** — tabelu delova sa merama, količinom, materijalom i kantovanjem
2. **Raspored po tablama** — kako se delovi seku iz table 2800×2070, sa iskorišćenjem
3. **PDF/CSV izlaz** — ono što se nosi u radionicu ili šalje dobavljaču ploče

### Šta NIJE (bar ne u v1)
- Nije CAD. Nije zamena za SketchUp/pCon.
- Nema parametarskih kataloga elemenata („donji kuhinjski 600×720×560 → generiši delove").
  Unos je ručni, deo po deo. *(Katalog je kandidat za v2 — vidi §9.)*
- Nema CNC nestinga proizvoljnih oblika. Samo pravougaoni delovi, guillotine rez.

---

## 2. Ključne odluke (potvrđene)

| Odluka | Izbor | Posledica |
|---|---|---|
| Radni prostor | **3D sklop gore, raspored po tablama dole** | Dva pogleda, jedan izvor podataka |
| Mašina | **Formatna testera / dobavljač** | Nesting MORA biti guillotine (rez kroz celu tablu, s kraja na kraj) |
| Unos delova | **Ručno, deo po deo** | Nema kataloga u v1; brži start, jednostavniji model |

**Zašto je guillotine bitno:** algoritam koji „lepo popuni" tablu proizvoljnim
rasporedom daje listu koja se ne može iseći na formatnoj testeri. Svaki rez mora
ići od ivice do ivice ostatka table. Ovo je tvrdo ograničenje algoritma, ne opcija.

---

## 3. Domenski model

```
Projekat (mušterija / posao)
├── Materijali[]        naziv, dekor, debljina, dim. table, kerf, trim, ima_teksturu, cena/m²
├── Kantovi[]           naziv, debljina (0.4 / 1 / 2 mm), boja, cena/m
├── Delovi[]            ← srce aplikacije
│     ├── naziv         "bok levi", "polica"
│     ├── materijalId
│     ├── L × W         dužina (u smeru teksture) × širina
│     ├── kom
│     ├── kantovanje    { L1, L2, W1, W2 } → kantId | prazno
│     ├── tekstura      zaključana (ne sme rotacija 90°) | slobodna
│     └── transform     pozicija + orijentacija u 3D sklopu
├── Sklop               gabarit korpusa + grupisanje delova
└── Plan rezanja[]      rezultat nestinga, po materijalu
```

### 3.1 Gotova mera vs. mera reza — obavezno
Najčešća greška u ručnim krojnim listama. Ako je gotova mera fronta 600 i kantuje
se 2 mm sa obe strane, ploča se seče na **596**. Aplikacija drži oba broja:

- korisnik bira režim: **unosim gotovu meru** (default) ili **unosim meru reza**
- krojna lista prikazuje **meru reza** (to ide na testeru)
- 3D sklop i sastavnica prikazuju **gotovu meru**

### 3.2 Debljina ploče u sklopu
Kad se u 3D-u ploča prisloni uz drugu, aplikacija zna debljinu i može da
**upozori** da mera ne štima (npr. korpus 600 spolja, a pod unesen kao 600 umesto
564). Ne menja unos automatski — samo javlja. Ručni unos ostaje ručni.

---

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

## 5. 3D sklop — kako da ne bude mučenje na telefonu

Slobodno prevlačenje ploče u 3D prostoru na telefonu je loše iskustvo. Predlog:

**Gabarit prvo.** Definišeš spoljnu kutiju korpusa (npr. 600 × 720 × 560).
Gabarit daje 6 jasnih referenci (levo, desno, gore, dole, napred, nazad).

**Postavljanje relacijom, ne prevlačenjem:**
- „postavi UZ levi bok, poravnato GORE i NAZAD"
- snap na lica postojećih ploča i na stranice gabarita
- `Dupliraj` / `Preslikaj` (levi bok → desni bok jednim klikom)

3D je pri tom **provera**, ne crtanje: vidiš da li se sklop zatvara, gde fali
ploča, gde se dve ploče preklapaju. Prevlačenje ostaje moguće na desktopu,
sa snapom na 1 mm.

---

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
| **F1** | Materijali, kantovi, unos delova, gotova/rez mera, lokalna persistencija | Digitalna tabela delova |
| **F2** | Nesting engine (guillotine + kerf + trim + tekstura) u workeru + SVG prikaz | Vidiš raspored i iskorišćenje |
| **F3** | PDF + CSV izlaz, sumarno, kantovanje u metrima | **Upotrebljiv proizvod → demo #1** |
| **F4** | 3D sklop: gabarit, snap poravnanje, dupliraj/preslikaj, provera sklopa | **demo #2** |
| **F5** | Supabase: nalozi, projekti, sync offline→online, deljiv link | Radi na više uređaja |
| **F6** | Optimizacije: randomized restart, ostaci, cene, redosled rezova | Ozbiljna alatka |

**Zašto nesting (F2) pre 3D-a (F4):** unos je ručni, znači 3D nije potreban da bi
lista postojala. Već posle F3 imaš nešto što tvoja ekipa koristi na poslu i o čemu
može dati povratnu informaciju. 3D dolazi na gotov, testiran temelj.

---

## 9. Otvorena pitanja / kasnije

- **Katalog parametarskih elemenata** (kuhinjski donji/gornji, plakar, fioke) —
  najveće ubrzanje, ali tek kad ručni unos radi savršeno
- **Okovi i fiorke** — bušenje, konfirmati, vođice? Verovatno van opsega.
- **Više sklopova u jednom projektu** — cela kuhinja, ne jedan element
  (nesting mora da spoji delove svih sklopova po materijalu — planirati model tako od početka)
- **Cenovnik ploča** — ručno ili uvoz od dobavljača
- **Odnos prema `tabla.nikvolt.com`** — deli isti PDF sloj, može zajednička biblioteka

---

## 10. Napomena o prioritetima

`nikvolt-planner` (React + Supabase + Zustand migracija) je i dalje prioritet #1.
Ovaj projekat je planiran, ali ne bi trebalo da mu uzme fokus dok Planner ne bude
gotov — osim ako ne postoji konkretan kupac ili posao koji to opravdava.
