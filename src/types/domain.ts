/** Domenski model — vidi PLAN.md §3 */

export type Uid = string;

/** Ploča iz koje se seče. Table i kerf su podesivi po materijalu. */
export interface Materijal {
  id: Uid;
  naziv: string;
  debljina: number;
  /** Dimenzije table, mm. Default 2800 × 2070. */
  tablaL: number;
  tablaW: number;
  /** Debljina reza, mm. Formatna testera ~3.2. */
  kerf: number;
  /** Obrez ivica table pre rezanja, mm (table imaju oštećene ivice). */
  trim: number;
  /** Ako ploča ima teksturu, delovi sa zaključanom teksturom ne smeju rotaciju 90°. */
  imaTeksturu: boolean;
  cenaPoM2: number | null;
  /** Boja u prikazu rasporeda. */
  boja: string;
}

export interface Kant {
  id: Uid;
  naziv: string;
  debljina: number;
  cenaPoM: number | null;
}

/**
 * Ivice dela. L1/L2 su duže ivice (po dužini), W1/W2 kraće (po širini).
 * Kantovanje NE menja meru — kantarica prefrezuje ivicu (PLAN.md §3.1).
 */
export type Ivica = 'L1' | 'L2' | 'W1' | 'W2';
export const IVICE: Ivica[] = ['L1', 'L2', 'W1', 'W2'];

export type Kantovanje = Record<Ivica, Uid | null>;

export const PRAZNO_KANTOVANJE: Kantovanje = { L1: null, L2: null, W1: null, W2: null };

/**
 * Ravan u kojoj ploča stoji. Određuje kako se dužina i širina dela
 * preslikavaju na ose korpusa:
 *   - horizontala (pod, plafon, polica): dužina → X, širina → Z, debljina → Y
 *   - bok (levi/desni):                  debljina → X, dužina → Y, širina → Z
 *   - front (front, leđa):               širina → X, dužina → Y, debljina → Z
 * Dužina uvek ide u smeru teksture.
 */
export type Ravan = 'horizontala' | 'bok' | 'front';
export const RAVNI: Ravan[] = ['horizontala', 'bok', 'front'];

/** Uz koju stranu gabarita se deo poravnava. */
export type Poravnanje = 'pocetak' | 'sredina' | 'kraj';

/**
 * Položaj u sklopu se ne pamti kao apsolutna koordinata nego kao
 * poravnanje uz gabarit plus pomak — tako majstor i govori: „uz levi bok,
 * uvučeno 18, poravnato gore". Kad se gabarit promeni, delovi ga prate.
 */
export interface Polozaj {
  ravan: Ravan;
  poravnanjeX: Poravnanje;
  poravnanjeY: Poravnanje;
  poravnanjeZ: Poravnanje;
  pomakX: number;
  pomakY: number;
  pomakZ: number;
}

export const PODRAZUMEVAN_POLOZAJ: Polozaj = {
  ravan: 'horizontala',
  poravnanjeX: 'pocetak',
  poravnanjeY: 'pocetak',
  poravnanjeZ: 'pocetak',
  pomakX: 0,
  pomakY: 0,
  pomakZ: 0,
};

/** Element u prostoru: donji kuhinjski, viseći, plakar... Grupiše delove. */
export interface Sklop {
  id: Uid;
  naziv: string;
  /** Gabarit korpusa, mm — X (širina), Y (visina), Z (dubina). */
  sirina: number | null;
  visina: number | null;
  dubina: number | null;
}

/** Jedna ploča. Mera koju uneseš je i mera reza. */
export interface Deo {
  id: Uid;
  sklopId: Uid | null;
  naziv: string;
  materijalId: Uid;
  /** Dužina — u smeru teksture, mm. */
  duzina: number;
  /** Širina, mm. */
  sirina: number;
  kom: number;
  kant: Kantovanje;
  /** Zaključana tekstura = nesting ne sme rotirati deo za 90°. */
  teksturaZakljucana: boolean;
  napomena: string;
  /** Gde deo stoji u sklopu. null = nije postavljen u prostor. */
  polozaj: Polozaj | null;
}

/** Projekat je ceo prostor: kuhinja, soba, predsoblje... */
export interface Projekat {
  id: Uid;
  naziv: string;
  musterija: string;
  datum: string;
  materijali: Materijal[];
  kantovi: Kant[];
  sklopovi: Sklop[];
  delovi: Deo[];
}
