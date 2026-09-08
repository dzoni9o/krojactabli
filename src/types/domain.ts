/** Domenski model — vidi PLAN.md §3 */

import type { Element, Prostorija } from './elementi';

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
 * Ručno dodata ploča — za ono što ne ispadne iz elementa: radna ploča,
 * maska, sokla, popravka. Mera koju uneseš je i mera reza.
 */
export interface Deo {
  id: Uid;
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
}

/**
 * Jedan red krojne liste. Dolazi ili iz elementa (generisan) ili iz ručnog
 * unosa. Sve što računa materijal, rez i cenu radi sa ovim, ne sa elementima.
 */
export interface StavkaListe {
  id: string;
  /** Odakle je: naziv elementa, ili prazno za ručno dodat deo. */
  poreklo: string;
  naziv: string;
  materijalId: Uid;
  duzina: number;
  sirina: number;
  kom: number;
  kant: Kantovanje;
  teksturaZakljucana: boolean;
  napomena: string;
}

/** Projekat je ceo prostor: kuhinja, soba, predsoblje... */
export interface Projekat {
  id: Uid;
  naziv: string;
  musterija: string;
  datum: string;
  materijali: Materijal[];
  kantovi: Kant[];
  /** Prostorija u koju se slaže. */
  prostorija: Prostorija;
  /** Elementi u prostoru — glavni sadržaj projekta. */
  elementi: Element[];
  /** Ručno dodati delovi, pored onih koje elementi sami daju. */
  delovi: Deo[];
}
