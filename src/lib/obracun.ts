import type { Kant, Materijal, StavkaListe } from '../types/domain';
import { IVICE } from '../types/domain';

/** Površina jedne stavke × komada, u m². */
export function povrsinaStavke(s: StavkaListe): number {
  return (s.duzina * s.sirina * s.kom) / 1_000_000;
}

/**
 * Metri kanta po ivici. L1/L2 idu po dužini, W1/W2 po širini.
 * Kant ne menja meru dela — samo se troši u metrima (PLAN.md §3.1).
 */
export function metriKantaStavke(stavka: StavkaListe): Map<string, number> {
  const po = new Map<string, number>();
  for (const ivica of IVICE) {
    const kantId = stavka.kant[ivica];
    if (!kantId) continue;
    const duzinaIvice = ivica === 'L1' || ivica === 'L2' ? stavka.duzina : stavka.sirina;
    const metara = (duzinaIvice * stavka.kom) / 1000;
    po.set(kantId, (po.get(kantId) ?? 0) + metara);
  }
  return po;
}

export interface StavkaMaterijala {
  materijal: Materijal;
  komada: number;
  m2: number;
}

export interface StavkaKanta {
  kant: Kant;
  metara: number;
}

export interface Rezime {
  ukupnoDelova: number;
  ukupnoKomada: number;
  ukupnoM2: number;
  poMaterijalu: StavkaMaterijala[];
  poKantu: StavkaKanta[];
}

export function rezimeStavki(
  stavke: StavkaListe[],
  materijali: Materijal[],
  kantovi: Kant[],
): Rezime {
  const poMat = new Map<string, StavkaMaterijala>();
  const poKant = new Map<string, number>();

  for (const stavka of stavke) {
    const materijal = materijali.find((m) => m.id === stavka.materijalId);
    if (materijal) {
      const red = poMat.get(materijal.id) ?? { materijal, komada: 0, m2: 0 };
      red.komada += stavka.kom;
      red.m2 += povrsinaStavke(stavka);
      poMat.set(materijal.id, red);
    }
    for (const [kantId, metara] of metriKantaStavke(stavka)) {
      poKant.set(kantId, (poKant.get(kantId) ?? 0) + metara);
    }
  }

  const poKantu: StavkaKanta[] = [];
  for (const [kantId, metara] of poKant) {
    const kant = kantovi.find((k) => k.id === kantId);
    if (kant) poKantu.push({ kant, metara });
  }

  return {
    ukupnoDelova: stavke.length,
    ukupnoKomada: stavke.reduce((z, s) => z + s.kom, 0),
    ukupnoM2: [...poMat.values()].reduce((z, s) => z + s.m2, 0),
    poMaterijalu: [...poMat.values()],
    poKantu,
  };
}

/** 1234.5 → "1.234,5" — srpski format, čitljiviji na listi. */
export function broj(n: number, decimala = 0): string {
  return n.toLocaleString('sr-RS', {
    minimumFractionDigits: decimala,
    maximumFractionDigits: decimala,
  });
}
