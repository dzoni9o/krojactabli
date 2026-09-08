# Krojač tabli

Alat za krojne liste: unosiš delove (ploče), grupišeš ih u sklopove, a
aplikacija računa materijal i — u sledećoj fazi — raspored rezova po tablama.

Plan i domenske odluke: **[PLAN.md](./PLAN.md)**

## Stanje

| Faza | Sadržaj | Stanje |
|---|---|---|
| F0 | Skelet: Vite + React + TS + Zustand, NikVolt dizajn, i18n sr/en | ✅ |
| F1 | Materijali, kantovanje, unos delova, sklopovi, lokalna persistencija | ✅ |
| F2 | Nesting (guillotine + kerf + obrez + tekstura) i prikaz tabli | ✅ |
| F3 | PDF i CSV izlaz | ✅ |
| F4 | 3D sklapanje korpusa | ✅ |
| F5 | Supabase sync (offline → online) | — |

## Pokretanje

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # provera tipova + produkcijski build
npm run typecheck
```

## Osnovna pravila domena

- **Mera koju uneseš je i mera reza.** Kantarica prefrezuje ivicu pre lepljenja
  kanta, pa kantovanje ne menja dimenziju ploče.
- **Rez mora biti guillotine** — od ivice do ivice, jer se seče na formatnoj testeri.
- **Projekat je ceo prostor** (kuhinja, soba…), sa više sklopova. Nesting spaja
  delove svih sklopova po materijalu.
- Default-i: tabla **2800 × 2070**, rez **3,2 mm**, obrez ivica **10 mm**.
- **Položaj u sklopu je poravnanje uz gabarit + pomak**, ne apsolutna koordinata —
  kad se gabarit promeni, delovi ga prate.

## Struktura

```
src/
  types/domain.ts     domenski model (Materijal, Kant, Deo, Sklop, Projekat)
  data/defaults.ts    podrazumevani materijali, kantovi i mere table
  lib/obracun.ts      površine, metri kanta, rezime projekta
  lib/nesting/        guillotine engine + Web Worker
  lib/izvoz/          PDF (jsPDF) i CSV, sa ugrađenim fontom za srpska slova
  lib/sklop.ts        položaj delova u prostoru i provera sklopa
  store/              Zustand: projekat (persist) + stanje UI-ja
  components/         Fioka, KantIzbor, Prekidac, TabBar, Polje
  screens/            Delovi, Materijali, izmena dela, placeholderi
  styles/             NikVolt dizajn sistem (tokens.css) + app.css
```
