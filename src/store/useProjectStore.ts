import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Deo, Kant, Kantovanje, Materijal, Projekat } from '../types/domain';
import { PRAZNO_KANTOVANJE } from '../types/domain';
import type { Element, Okret, Prostorija, TipElementa } from '../types/elementi';
import { opisTipa, PODRAZUMEVANA_PROSTORIJA } from '../types/elementi';
import { noviProjekat } from '../data/defaults';
import { otisak, slobodnoMesto } from '../lib/prostor';
import { uid } from '../lib/uid';

interface ProjectState {
  projekat: Projekat;

  postaviProjekat: (p: Partial<Pick<Projekat, 'naziv' | 'musterija' | 'datum'>>) => void;
  postaviProstoriju: (izmena: Partial<Prostorija>) => void;
  resetProjekat: () => void;

  dodajElement: (tip: TipElementa) => string;
  izmeniElement: (id: string, izmena: Partial<Element>) => void;
  pomeriElement: (id: string, x: number, z: number) => void;
  okreniElement: (id: string) => void;
  duplirajElement: (id: string) => string | null;
  obrisiElement: (id: string) => void;

  dodajDeo: (deo?: Partial<Deo>) => string;
  izmeniDeo: (id: string, izmena: Partial<Deo>) => void;
  obrisiDeo: (id: string) => void;
  duplirajDeo: (id: string) => void;

  izmeniKant: (id: string, izmena: Partial<Kant>) => void;
  dodajMaterijal: () => string;
  izmeniMaterijal: (id: string, izmena: Partial<Materijal>) => void;
  obrisiMaterijal: (id: string) => void;
}

function praznoKantovanje(): Kantovanje {
  return { ...PRAZNO_KANTOVANJE };
}

/** Korpus ide na prvi materijal, leđa na najtanji, front na onaj sa teksturom. */
function podrazumevaniMaterijali(materijali: Materijal[]) {
  const korpus = materijali[0]?.id ?? '';
  const ledja = [...materijali].sort((a, b) => a.debljina - b.debljina)[0]?.id ?? korpus;
  const front = materijali.find((m) => m.imaTeksturu)?.id ?? korpus;
  return { korpus, ledja, front };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projekat: noviProjekat(),

      postaviProjekat: (p) => set((s) => ({ projekat: { ...s.projekat, ...p } })),

      postaviProstoriju: (izmena) =>
        set((s) => ({
          projekat: { ...s.projekat, prostorija: { ...s.projekat.prostorija, ...izmena } },
        })),

      resetProjekat: () => set({ projekat: noviProjekat() }),

      /* ── Elementi ─────────────────────────────────────── */

      dodajElement: (tip) => {
        const id = uid('el');
        const opis = opisTipa(tip);
        const { projekat } = get();
        const mat = podrazumevaniMaterijali(projekat.materijali);

        const broj = projekat.elementi.filter((e) => e.tip === tip).length + 1;
        const nacrt: Element = {
          id,
          tip,
          naziv: `${opis.naziv} ${broj}`,
          sirina: opis.sirina,
          visina: opis.visina,
          dubina: opis.dubina,
          x: 0,
          z: 0,
          podizanje: opis.podizanje,
          okret: 0,
          imaFront: opis.imaFront,
          imaLedja: opis.imaLedja,
          brojPolica: opis.brojPolica,
          brojFioka: opis.brojFioka,
          brojKrila: opis.brojKrila,
          materijalKorpusa: mat.korpus,
          materijalFronta: mat.front,
          materijalLedja: mat.ledja,
        };

        const debljinaFronta =
          projekat.materijali.find((m) => m.id === mat.front)?.debljina ?? 18;
        // Novi element ne pada preko postojećih — traži prvo slobodno mesto.
        const mesto = slobodnoMesto(
          otisak(nacrt, debljinaFronta),
          projekat.elementi
            .filter((e) => e.podizanje === nacrt.podizanje)
            .map((e) => otisak(e, debljinaFronta)),
          projekat.prostorija,
        );

        set((s) => ({
          projekat: { ...s.projekat, elementi: [...s.projekat.elementi, { ...nacrt, ...mesto }] },
        }));
        return id;
      },

      izmeniElement: (id, izmena) =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            elementi: s.projekat.elementi.map((e) => (e.id === id ? { ...e, ...izmena } : e)),
          },
        })),

      pomeriElement: (id, x, z) =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            elementi: s.projekat.elementi.map((e) => (e.id === id ? { ...e, x, z } : e)),
          },
        })),

      okreniElement: (id) =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            elementi: s.projekat.elementi.map((e) =>
              e.id === id ? { ...e, okret: (((e.okret + 90) % 360) as Okret) } : e,
            ),
          },
        })),

      duplirajElement: (id) => {
        const izvor = get().projekat.elementi.find((e) => e.id === id);
        if (!izvor) return null;
        const noviId = uid('el');
        const debljinaFronta =
          get().projekat.materijali.find((m) => m.id === izvor.materijalFronta)?.debljina ?? 18;
        const kopija: Element = { ...izvor, id: noviId };
        const mesto = slobodnoMesto(
          otisak(kopija, debljinaFronta),
          get()
            .projekat.elementi.filter((e) => e.podizanje === izvor.podizanje)
            .map((e) => otisak(e, debljinaFronta)),
          get().projekat.prostorija,
        );
        set((s) => {
          const i = s.projekat.elementi.findIndex((e) => e.id === id);
          const elementi = [...s.projekat.elementi];
          elementi.splice(i + 1, 0, { ...kopija, ...mesto });
          return { projekat: { ...s.projekat, elementi } };
        });
        return noviId;
      },

      obrisiElement: (id) =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            elementi: s.projekat.elementi.filter((e) => e.id !== id),
          },
        })),

      /* ── Ručno dodati delovi ──────────────────────────── */

      dodajDeo: (deo) => {
        const id = uid('deo');
        const prviMaterijal = get().projekat.materijali[0];
        const noviDeo: Deo = {
          naziv: '',
          materijalId: prviMaterijal ? prviMaterijal.id : '',
          duzina: 0,
          sirina: 0,
          kom: 1,
          teksturaZakljucana: false,
          napomena: '',
          ...deo,
          id,
          kant: deo?.kant ? { ...deo.kant } : praznoKantovanje(),
        };
        set((s) => ({ projekat: { ...s.projekat, delovi: [...s.projekat.delovi, noviDeo] } }));
        return id;
      },

      izmeniDeo: (id, izmena) =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            delovi: s.projekat.delovi.map((d) => (d.id === id ? { ...d, ...izmena } : d)),
          },
        })),

      obrisiDeo: (id) =>
        set((s) => ({
          projekat: { ...s.projekat, delovi: s.projekat.delovi.filter((d) => d.id !== id) },
        })),

      duplirajDeo: (id) =>
        set((s) => {
          const i = s.projekat.delovi.findIndex((d) => d.id === id);
          if (i === -1) return s;
          const izvor = s.projekat.delovi[i];
          const kopija: Deo = { ...izvor, id: uid('deo'), kant: { ...izvor.kant } };
          const delovi = [...s.projekat.delovi];
          delovi.splice(i + 1, 0, kopija);
          return { projekat: { ...s.projekat, delovi } };
        }),

      /* ── Materijali i kantovi ─────────────────────────── */

      izmeniKant: (id, izmena) =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            kantovi: s.projekat.kantovi.map((k) => (k.id === id ? { ...k, ...izmena } : k)),
          },
        })),

      dodajMaterijal: () => {
        const id = uid('mat');
        const uzor = get().projekat.materijali[0];
        set((s) => ({
          projekat: {
            ...s.projekat,
            materijali: [
              ...s.projekat.materijali,
              {
                id,
                naziv: 'Novi materijal',
                debljina: uzor?.debljina ?? 18,
                tablaL: uzor?.tablaL ?? 2800,
                tablaW: uzor?.tablaW ?? 2070,
                kerf: uzor?.kerf ?? 3.2,
                trim: uzor?.trim ?? 10,
                imaTeksturu: false,
                cenaPoM2: null,
                boja: '#7a7a7a',
              },
            ],
          },
        }));
        return id;
      },

      izmeniMaterijal: (id, izmena) =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            materijali: s.projekat.materijali.map((m) => (m.id === id ? { ...m, ...izmena } : m)),
          },
        })),

      /** Materijal se ne može obrisati dok ga neko koristi. */
      obrisiMaterijal: (id) =>
        set((s) => {
          const uElementima = s.projekat.elementi.some(
            (e) =>
              e.materijalKorpusa === id || e.materijalFronta === id || e.materijalLedja === id,
          );
          if (uElementima || s.projekat.delovi.some((d) => d.materijalId === id)) return s;
          return {
            projekat: {
              ...s.projekat,
              materijali: s.projekat.materijali.filter((m) => m.id !== id),
            },
          };
        }),
    }),
    {
      name: 'krojac-tabli/projekat',
      version: 3,
      /**
       * v3 menja suštinu: delovi se više ne unose ručno nego ispadaju iz
       * elemenata. Stari ručno uneti delovi ostaju kao „dodatni delovi",
       * ne gube se; sklopovi otpadaju jer ih zamenjuju elementi.
       */
      migrate: (sacuvano, verzija) => {
        const stanje = sacuvano as { projekat: Projekat & Record<string, unknown> };
        if (verzija < 3 && stanje?.projekat) {
          const p = stanje.projekat;
          p.prostorija = p.prostorija ?? { ...PODRAZUMEVANA_PROSTORIJA };
          p.elementi = p.elementi ?? [];
          p.delovi = (p.delovi ?? []).map((deo) => {
            const d = deo as unknown as Record<string, unknown>;
            delete d.sklopId;
            delete d.polozaj;
            return deo;
          });
          delete p.sklopovi;
        }
        return stanje;
      },
    },
  ),
);
