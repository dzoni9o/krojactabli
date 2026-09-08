/**
 * Element je ono što majstor stvarno stavlja u prostor: gotov korpus.
 * Delovi se iz njega RAČUNAJU — ne unose se rukom (vidi lib/generisi.ts).
 */

import type { Uid } from './domain';

export type TipElementa = 'donji' | 'visici' | 'fioke' | 'plakar' | 'polica';

/** Koliko element može da se okrene oko svoje ose, u koracima od 90°. */
export type Okret = 0 | 90 | 180 | 270;

export interface Element {
  id: Uid;
  tip: TipElementa;
  naziv: string;

  /** Mere korpusa, mm. Front dolazi ISPRED dubine i dodaje svoju debljinu. */
  sirina: number;
  visina: number;
  dubina: number;

  /** Položaj u prostoriji: X levo–desno, Z od zida ka sobi. Y je podizanje. */
  x: number;
  z: number;
  /** Podizanje od poda — viseći elementi i sokla. */
  podizanje: number;
  okret: Okret;

  imaFront: boolean;
  imaLedja: boolean;
  brojPolica: number;
  /** Broj fioka; kad je > 0, front se deli na toliko frontova. */
  brojFioka: number;
  /** Broj krila fronta (1 ili 2). */
  brojKrila: number;

  materijalKorpusa: Uid;
  materijalFronta: Uid;
  materijalLedja: Uid;
}

export interface OpisTipa {
  tip: TipElementa;
  naziv: string;
  ikona: string;
  /** Podrazumevane mere i opcije za novi element ovog tipa. */
  sirina: number;
  visina: number;
  dubina: number;
  podizanje: number;
  imaFront: boolean;
  imaLedja: boolean;
  brojPolica: number;
  brojFioka: number;
  brojKrila: number;
}

/** Katalog: ovo su tipovi koje biraš, sa merama kakve se stvarno rade. */
export const KATALOG: OpisTipa[] = [
  {
    tip: 'donji',
    naziv: 'Donji element',
    ikona: '▤',
    sirina: 600,
    visina: 720,
    dubina: 560,
    podizanje: 100,
    imaFront: true,
    imaLedja: true,
    brojPolica: 1,
    brojFioka: 0,
    brojKrila: 1,
  },
  {
    tip: 'fioke',
    naziv: 'Element sa fiokama',
    ikona: '▥',
    sirina: 600,
    visina: 720,
    dubina: 560,
    podizanje: 100,
    imaFront: true,
    imaLedja: true,
    brojPolica: 0,
    brojFioka: 4,
    brojKrila: 1,
  },
  {
    tip: 'visici',
    naziv: 'Viseći element',
    ikona: '▣',
    sirina: 600,
    visina: 720,
    dubina: 320,
    podizanje: 1450,
    imaFront: true,
    imaLedja: true,
    brojPolica: 1,
    brojFioka: 0,
    brojKrila: 1,
  },
  {
    tip: 'plakar',
    naziv: 'Plakar',
    ikona: '▦',
    sirina: 800,
    visina: 2000,
    dubina: 600,
    podizanje: 100,
    imaFront: true,
    imaLedja: true,
    brojPolica: 4,
    brojFioka: 0,
    brojKrila: 2,
  },
  {
    tip: 'polica',
    naziv: 'Otvorena polica',
    ikona: '▧',
    sirina: 600,
    visina: 720,
    dubina: 300,
    podizanje: 0,
    imaFront: false,
    imaLedja: false,
    brojPolica: 2,
    brojFioka: 0,
    brojKrila: 1,
  },
];

export function opisTipa(tip: TipElementa): OpisTipa {
  return KATALOG.find((k) => k.tip === tip) ?? KATALOG[0];
}

/** Prostorija u koju se elementi slažu. Zidovi daju za šta da se zalepe. */
export interface Prostorija {
  sirina: number;
  duzina: number;
  visina: number;
}

export const PODRAZUMEVANA_PROSTORIJA: Prostorija = {
  sirina: 4000,
  duzina: 3000,
  visina: 2600,
};
