import type { Kant, Materijal, Projekat } from '../types/domain';
import { uid } from '../lib/uid';

/** Potvrđeni default-i: tabla 2800 × 2070, kerf 3,2 mm, obrez 10 mm. */
export const TABLA_L = 2800;
export const TABLA_W = 2070;
export const KERF = 3.2;
export const TRIM = 10;

export function podrazumevaniMaterijali(): Materijal[] {
  const osnova = { tablaL: TABLA_L, tablaW: TABLA_W, kerf: KERF, trim: TRIM, cenaPoM2: null };
  return [
    {
      id: 'mat_iver18',
      naziv: 'Iverica 18 mm',
      debljina: 18,
      imaTeksturu: false,
      boja: '#c9a227',
      ...osnova,
    },
    {
      id: 'mat_iver18d',
      naziv: 'Iverica 18 mm — dekor',
      debljina: 18,
      imaTeksturu: true,
      boja: '#8f6b3a',
      ...osnova,
    },
    {
      id: 'mat_hdf3',
      naziv: 'HDF leđa 3 mm',
      debljina: 3,
      imaTeksturu: false,
      boja: '#6b7280',
      ...osnova,
    },
  ];
}

export function podrazumevaniKantovi(): Kant[] {
  return [
    { id: 'kant_04', naziv: 'ABS 0,4 mm', debljina: 0.4, cenaPoM: null },
    { id: 'kant_1', naziv: 'ABS 1 mm', debljina: 1, cenaPoM: null },
    { id: 'kant_2', naziv: 'ABS 2 mm', debljina: 2, cenaPoM: null },
  ];
}

export function noviProjekat(naziv = 'Novi projekat'): Projekat {
  return {
    id: uid('prj'),
    naziv,
    musterija: '',
    datum: new Date().toISOString().slice(0, 10),
    materijali: podrazumevaniMaterijali(),
    kantovi: podrazumevaniKantovi(),
    sklopovi: [],
    delovi: [],
  };
}
