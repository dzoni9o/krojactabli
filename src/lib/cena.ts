import type { Projekat } from '../types/domain';
import type { RasporedMaterijala } from './nesting/tipovi';
import { rezimeStavki } from './obracun';
import { stavkeListe } from './lista';

export interface StavkaCene {
  naziv: string;
  kolicina: string;
  iznos: number;
}

export interface Obracun {
  stavke: StavkaCene[];
  ukupno: number;
  /** true kad bar jednoj stavci fali cena — zbir onda nije pun. */
  nepotpuno: boolean;
}

/**
 * Ploča se plaća po celoj tabli, ne po iskorišćenoj površini — zato cena
 * ide na broj tabli iz rasporeda, a ne na kvadraturu delova.
 */
export function obracunajCenu(
  projekat: Projekat,
  rasporedi: RasporedMaterijala[] | null,
): Obracun {
  const stavke: StavkaCene[] = [];
  let nepotpuno = false;

  for (const raspored of rasporedi ?? []) {
    const materijal = projekat.materijali.find((m) => m.id === raspored.materijalId);
    if (!materijal) continue;
    const povrsinaTable = (materijal.tablaL * materijal.tablaW) / 1_000_000;
    const tabli = raspored.table.length;
    if (materijal.cenaPoM2 === null) {
      if (tabli > 0) nepotpuno = true;
      continue;
    }
    stavke.push({
      naziv: materijal.naziv,
      kolicina: `${tabli} × ${povrsinaTable.toFixed(2)} m²`,
      iznos: tabli * povrsinaTable * materijal.cenaPoM2,
    });
  }

  const rezime = rezimeStavki(stavkeListe(projekat), projekat.materijali, projekat.kantovi);
  for (const s of rezime.poKantu) {
    if (s.kant.cenaPoM === null) {
      nepotpuno = true;
      continue;
    }
    stavke.push({
      naziv: s.kant.naziv,
      kolicina: `${s.metara.toFixed(1)} m`,
      iznos: s.metara * s.kant.cenaPoM,
    });
  }

  return {
    stavke,
    ukupno: stavke.reduce((z, s) => z + s.iznos, 0),
    nepotpuno,
  };
}

export function dinara(n: number): string {
  return n.toLocaleString('sr-RS', { maximumFractionDigits: 0 });
}
