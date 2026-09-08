import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Deo, Kantovanje, Materijal, Projekat, Sklop } from '../types/domain';
import { PRAZNO_KANTOVANJE } from '../types/domain';
import { noviProjekat } from '../data/defaults';
import { uid } from '../lib/uid';

interface ProjectState {
  projekat: Projekat;

  postaviProjekat: (p: Partial<Pick<Projekat, 'naziv' | 'musterija' | 'datum'>>) => void;
  resetProjekat: () => void;

  dodajSklop: (naziv: string) => string;
  izmeniSklop: (id: string, izmena: Partial<Sklop>) => void;
  obrisiSklop: (id: string) => void;

  dodajDeo: (deo?: Partial<Deo>) => string;
  izmeniDeo: (id: string, izmena: Partial<Deo>) => void;
  obrisiDeo: (id: string) => void;
  duplirajDeo: (id: string) => void;

  /** Zaključava teksturu svim delovima na materijalima sa teksturom. */
  zakljucajTeksturuGdeTreba: () => void;

  dodajMaterijal: () => string;
  izmeniMaterijal: (id: string, izmena: Partial<Materijal>) => void;
  obrisiMaterijal: (id: string) => void;
}

function praznoKantovanje(): Kantovanje {
  return { ...PRAZNO_KANTOVANJE };
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projekat: noviProjekat(),

      postaviProjekat: (p) => set((s) => ({ projekat: { ...s.projekat, ...p } })),

      resetProjekat: () => set({ projekat: noviProjekat() }),

      dodajSklop: (naziv) => {
        const id = uid('skl');
        set((s) => ({
          projekat: {
            ...s.projekat,
            sklopovi: [
              ...s.projekat.sklopovi,
              { id, naziv, sirina: null, visina: null, dubina: null },
            ],
          },
        }));
        return id;
      },

      izmeniSklop: (id, izmena) =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            sklopovi: s.projekat.sklopovi.map((k) => (k.id === id ? { ...k, ...izmena } : k)),
          },
        })),

      /** Brisanje sklopa ne briše delove — vraća ih u „bez sklopa". */
      obrisiSklop: (id) =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            sklopovi: s.projekat.sklopovi.filter((k) => k.id !== id),
            delovi: s.projekat.delovi.map((d) =>
              d.sklopId === id ? { ...d, sklopId: null } : d,
            ),
          },
        })),

      dodajDeo: (deo) => {
        const id = uid('deo');
        const prviMaterijal = get().projekat.materijali[0];
        const noviDeo: Deo = {
          sklopId: null,
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
        set((s) => ({
          projekat: { ...s.projekat, delovi: [...s.projekat.delovi, noviDeo] },
        }));
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

      zakljucajTeksturuGdeTreba: () =>
        set((s) => ({
          projekat: {
            ...s.projekat,
            delovi: s.projekat.delovi.map((d) => {
              const m = s.projekat.materijali.find((x) => x.id === d.materijalId);
              return m?.imaTeksturu ? { ...d, teksturaZakljucana: true } : d;
            }),
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

      /** Materijal se ne može obrisati dok ga neki deo koristi. */
      obrisiMaterijal: (id) =>
        set((s) => {
          if (s.projekat.delovi.some((d) => d.materijalId === id)) return s;
          return {
            projekat: {
              ...s.projekat,
              materijali: s.projekat.materijali.filter((m) => m.id !== id),
            },
          };
        }),
    }),
    { name: 'krojac-tabli/projekat', version: 1 },
  ),
);
