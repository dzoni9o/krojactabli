import type { Element, Prostorija } from '../types/elementi';
import { gabaritElementa } from './generisi';

/** Otisak elementa na podu, posle okretanja. */
export interface Otisak {
  id: string;
  x: number;
  z: number;
  sirina: number;
  dubina: number;
}

export function otisak(element: Element, debljinaFronta: number): Otisak {
  const g = gabaritElementa(element, debljinaFronta);
  return { id: element.id, x: element.x, z: element.z, sirina: g.sirina, dubina: g.dubina };
}

/** Koliko sme da promaši a da se ipak zalepi, mm. */
export const PRAG_LEPLJENJA = 90;

export type VrstaLepka = 'zid' | 'element' | null;

export interface Lepljenje {
  x: number;
  z: number;
  poX: VrstaLepka;
  poZ: VrstaLepka;
}

interface Kandidat {
  vrednost: number;
  vrsta: Exclude<VrstaLepka, null>;
}

function najblizi(zeljeno: number, kandidati: Kandidat[]): Kandidat | null {
  let najbolji: Kandidat | null = null;
  let najmanja = PRAG_LEPLJENJA;
  for (const k of kandidati) {
    const razlika = Math.abs(zeljeno - k.vrednost);
    // Zid ima prednost kad su podjednako blizu — uz zid se i radi.
    if (razlika < najmanja || (razlika === najmanja && k.vrsta === 'zid')) {
      najmanja = razlika;
      najbolji = k;
    }
  }
  return najbolji;
}

/**
 * Lepi element uz zidove i uz susedne elemente.
 *
 * Ne traži savršen potez prstom: dovoljno je da priđeš na 9 cm i element
 * sam sedne uz zid ili uz komšiju, bez zazora i bez preklapanja.
 */
export function prilepi(
  zeljenoX: number,
  zeljenoZ: number,
  ovaj: Otisak,
  ostali: Otisak[],
  prostorija: Prostorija,
): Lepljenje {
  const poX: Kandidat[] = [
    { vrednost: 0, vrsta: 'zid' },
    { vrednost: prostorija.sirina - ovaj.sirina, vrsta: 'zid' },
  ];
  const poZ: Kandidat[] = [
    { vrednost: 0, vrsta: 'zid' },
    { vrednost: prostorija.duzina - ovaj.dubina, vrsta: 'zid' },
  ];

  for (const drugi of ostali) {
    if (drugi.id === ovaj.id) continue;
    // uz levu/desnu stranu komšije, i poravnato sa njegovim ivicama
    poX.push(
      { vrednost: drugi.x + drugi.sirina, vrsta: 'element' },
      { vrednost: drugi.x - ovaj.sirina, vrsta: 'element' },
      { vrednost: drugi.x, vrsta: 'element' },
      { vrednost: drugi.x + drugi.sirina - ovaj.sirina, vrsta: 'element' },
    );
    poZ.push(
      { vrednost: drugi.z + drugi.dubina, vrsta: 'element' },
      { vrednost: drugi.z - ovaj.dubina, vrsta: 'element' },
      { vrednost: drugi.z, vrsta: 'element' },
      { vrednost: drugi.z + drugi.dubina - ovaj.dubina, vrsta: 'element' },
    );
  }

  const nadjenX = najblizi(zeljenoX, poX);
  const nadjenZ = najblizi(zeljenoZ, poZ);

  // Bez lepljenja — zaokruži na centimetar, da mere ostanu okrugle.
  const zaokruzi = (v: number) => Math.round(v / 10) * 10;

  return {
    x: uSobi(nadjenX ? nadjenX.vrednost : zaokruzi(zeljenoX), ovaj.sirina, prostorija.sirina),
    z: uSobi(nadjenZ ? nadjenZ.vrednost : zaokruzi(zeljenoZ), ovaj.dubina, prostorija.duzina),
    poX: nadjenX ? nadjenX.vrsta : null,
    poZ: nadjenZ ? nadjenZ.vrsta : null,
  };
}

/**
 * Zid zaustavlja element. Bez ovoga bi jedan zamah prstom preko zida odbacio
 * element van sobe, i onda ga tražiš.
 */
function uSobi(vrednost: number, velicina: number, raspon: number): number {
  const najvise = raspon - velicina;
  if (najvise <= 0) return 0;
  return Math.min(Math.max(vrednost, 0), najvise);
}

/** Dva elementa se preklapaju samo ako se seku i po podu i po visini. */
export function preklapajuSe(a: Element, b: Element, tf: number): boolean {
  const oa = otisak(a, tf);
  const ob = otisak(b, tf);
  const poPodu =
    Math.min(oa.x + oa.sirina, ob.x + ob.sirina) - Math.max(oa.x, ob.x) > 1 &&
    Math.min(oa.z + oa.dubina, ob.z + ob.dubina) - Math.max(oa.z, ob.z) > 1;
  const poVisini =
    Math.min(a.podizanje + a.visina, b.podizanje + b.visina) -
      Math.max(a.podizanje, b.podizanje) >
    1;
  return poPodu && poVisini;
}

export interface NalazProstora {
  vrsta: 'preklapanje' | 'van-sobe';
  a: string;
  b?: string;
}

export function proveriProstor(
  elementi: Element[],
  prostorija: Prostorija,
  tf: number,
): NalazProstora[] {
  const nalazi: NalazProstora[] = [];

  for (let i = 0; i < elementi.length; i++) {
    for (let j = i + 1; j < elementi.length; j++) {
      if (preklapajuSe(elementi[i], elementi[j], tf))
        nalazi.push({ vrsta: 'preklapanje', a: elementi[i].naziv, b: elementi[j].naziv });
    }
  }

  for (const e of elementi) {
    const o = otisak(e, tf);
    if (
      o.x < -1 ||
      o.z < -1 ||
      o.x + o.sirina > prostorija.sirina + 1 ||
      o.z + o.dubina > prostorija.duzina + 1 ||
      e.podizanje + e.visina > prostorija.visina + 1
    )
      nalazi.push({ vrsta: 'van-sobe', a: e.naziv });
  }

  return nalazi;
}

/** Prvo slobodno mesto uz zadnji zid, s leva na desno. */
export function slobodnoMesto(
  novi: Otisak,
  postojeci: Otisak[],
  prostorija: Prostorija,
): { x: number; z: number } {
  const uzZid = postojeci.filter((o) => o.z < 1).sort((a, b) => a.x - b.x);
  let x = 0;
  for (const o of uzZid) {
    if (x + novi.sirina <= o.x + 1) break;
    x = o.x + o.sirina;
  }
  if (x + novi.sirina > prostorija.sirina) x = 0;
  return { x, z: 0 };
}
