/** Ulaz i izlaz nesting engine-a. Sve mere u milimetrima. */

export interface Tabla {
  duzina: number;
  sirina: number;
  /** Debljina reza — troši se pri svakom rezu. */
  kerf: number;
  /** Obrez ivica table pre rezanja. */
  trim: number;
}

/** Jedan komad koji treba iseći. Delovi sa kom > 1 se razlažu na više komada. */
export interface UlazniKomad {
  /** ID dela iz projekta — više komada može deliti isti deoId. */
  deoId: string;
  naziv: string;
  duzina: number;
  sirina: number;
  /** Ako je tekstura zaključana, komad se ne sme okrenuti za 90°. */
  rotacijaDozvoljena: boolean;
}

export interface Postavka {
  deoId: string;
  naziv: string;
  /** Redni broj u planu rezanja — to je oznaka na crtežu. */
  redni: number;
  x: number;
  y: number;
  /** Stvarne dimenzije na tabli, posle eventualne rotacije. */
  w: number;
  h: number;
  rotiran: boolean;
}

export interface Pravougaonik {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TablaPlan {
  redni: number;
  postavke: Postavka[];
  /** Iskorišćenje pune table (uključujući obrez), 0..1. */
  iskoriscenje: number;
  /** Slobodni pravougaonici veći od praga — upotrebljivi ostaci. */
  ostaci: Pravougaonik[];
}

export interface Nesmesten {
  deoId: string;
  naziv: string;
  razlog: 'veci-od-table';
}

export interface RasporedMaterijala {
  materijalId: string;
  tabla: Tabla;
  table: TablaPlan[];
  nesmesteni: Nesmesten[];
  /** Prosečno iskorišćenje svih tabli, 0..1. */
  iskoriscenje: number;
  /** Najveći upotrebljiv ostatak na poslednjoj tabli. */
  najveciOstatak: Pravougaonik | null;
}

export interface Napredak {
  urađeno: number;
  ukupno: number;
}
