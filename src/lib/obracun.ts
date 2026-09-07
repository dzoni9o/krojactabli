import type { Deo, Kant, Materijal, Projekat } from '../types/domain';
import { IVICE } from '../types/domain';

/** Površina jednog dela × komada, u m². */
export function povrsinaDela(deo: Deo): number {
  return (deo.duzina * deo.sirina * deo.kom) / 1_000_000;
}

/**
 * Metri kanta po ivici. L1/L2 idu po dužini, W1/W2 po širini.
 * Kant ne menja meru dela — samo se troši u metrima (PLAN.md §3.1).
 */
export function metriKantaDela(deo: Deo): Map<string, number> {
  const po = new Map<string, number>();
  for (const ivica of IVICE) {
    const kantId = deo.kant[ivica];
    if (!kantId) continue;
    const duzinaIvice = ivica === 'L1' || ivica === 'L2' ? deo.duzina : deo.sirina;
    const metara = (duzinaIvice * deo.kom) / 1000;
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

export function rezimeProjekta(projekat: Projekat): Rezime {
  const poMat = new Map<string, StavkaMaterijala>();
  const poKant = new Map<string, number>();

  for (const deo of projekat.delovi) {
    const materijal = projekat.materijali.find((m) => m.id === deo.materijalId);
    if (materijal) {
      const stavka = poMat.get(materijal.id) ?? { materijal, komada: 0, m2: 0 };
      stavka.komada += deo.kom;
      stavka.m2 += povrsinaDela(deo);
      poMat.set(materijal.id, stavka);
    }
    for (const [kantId, metara] of metriKantaDela(deo)) {
      poKant.set(kantId, (poKant.get(kantId) ?? 0) + metara);
    }
  }

  const poKantu: StavkaKanta[] = [];
  for (const [kantId, metara] of poKant) {
    const kant = projekat.kantovi.find((k) => k.id === kantId);
    if (kant) poKantu.push({ kant, metara });
  }

  return {
    ukupnoDelova: projekat.delovi.length,
    ukupnoKomada: projekat.delovi.reduce((z, d) => z + d.kom, 0),
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
