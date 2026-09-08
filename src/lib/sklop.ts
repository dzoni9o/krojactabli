import type { Deo, Materijal, Polozaj, Poravnanje, Sklop } from '../types/domain';

/** Kutija u prostoru sklopa: X širina, Y visina, Z dubina; ishodište dole-levo-napred. */
export interface Kutija {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
}

export interface Gabarit {
  sirina: number;
  visina: number;
  dubina: number;
}

export function gabaritSklopa(sklop: Sklop): Gabarit {
  return {
    sirina: sklop.sirina ?? 600,
    visina: sklop.visina ?? 720,
    dubina: sklop.dubina ?? 560,
  };
}

/** Debljina ploče ide na treću osu — onu koju ravan ne koristi za mere dela. */
export function dimenzijeDela(
  deo: Deo,
  debljina: number,
  ravan: Polozaj['ravan'],
): [number, number, number] {
  switch (ravan) {
    case 'horizontala':
      return [deo.duzina, debljina, deo.sirina];
    case 'bok':
      return [debljina, deo.duzina, deo.sirina];
    case 'front':
      return [deo.sirina, deo.duzina, debljina];
  }
}

function poOsi(
  poravnanje: Poravnanje,
  pomak: number,
  velicinaDela: number,
  velicinaGabarita: number,
): number {
  switch (poravnanje) {
    case 'pocetak':
      return pomak;
    case 'sredina':
      return (velicinaGabarita - velicinaDela) / 2 + pomak;
    case 'kraj':
      return velicinaGabarita - velicinaDela - pomak;
  }
}

export function kutijaDela(deo: Deo, debljina: number, gabarit: Gabarit): Kutija | null {
  if (!deo.polozaj) return null;
  const p = deo.polozaj;
  const [sx, sy, sz] = dimenzijeDela(deo, debljina, p.ravan);
  return {
    x: poOsi(p.poravnanjeX, p.pomakX, sx, gabarit.sirina),
    y: poOsi(p.poravnanjeY, p.pomakY, sy, gabarit.visina),
    z: poOsi(p.poravnanjeZ, p.pomakZ, sz, gabarit.dubina),
    sx,
    sy,
    sz,
  };
}

export interface PostavljenDeo {
  deo: Deo;
  kutija: Kutija;
  boja: string;
  /** Redni broj komada kad je kom > 1 — svaki komad se crta zasebno. */
  komad: number;
}

/**
 * Delovi jednog sklopa smešteni u prostor. Kad je kom > 1, crta se samo prvi
 * komad — ostali su isti deo negde drugde i njihov položaj se zadaje zasebno.
 */
export function postavljeniDelovi(
  sklop: Sklop,
  delovi: Deo[],
  materijali: Materijal[],
): PostavljenDeo[] {
  const gabarit = gabaritSklopa(sklop);
  const rezultat: PostavljenDeo[] = [];

  for (const deo of delovi) {
    if (deo.sklopId !== sklop.id || !deo.polozaj) continue;
    const materijal = materijali.find((m) => m.id === deo.materijalId);
    const kutija = kutijaDela(deo, materijal?.debljina ?? 18, gabarit);
    if (!kutija) continue;
    rezultat.push({ deo, kutija, boja: materijal?.boja ?? '#8a8a8a', komad: 1 });
  }

  return rezultat;
}

/* ── Provera sklopa ─────────────────────────────────────── */

/** Preklapanje ispod ovoga je zaokruživanje, ne greška. */
const DOZVOLJENO = 0.5;

function presek(a: Kutija, b: Kutija): number {
  const px = Math.min(a.x + a.sx, b.x + b.sx) - Math.max(a.x, b.x);
  const py = Math.min(a.y + a.sy, b.y + b.sy) - Math.max(a.y, b.y);
  const pz = Math.min(a.z + a.sz, b.z + b.sz) - Math.max(a.z, b.z);
  if (px <= DOZVOLJENO || py <= DOZVOLJENO || pz <= DOZVOLJENO) return 0;
  return Math.min(px, py, pz);
}

export type Nalaz =
  | { vrsta: 'preklapanje'; a: string; b: string; dubina: number }
  | { vrsta: 'van-gabarita'; deo: string };

/**
 * Traži dve greške koje se u glavi ne vide, a na tabli koštaju:
 * ploče koje zauzimaju isti prostor i ploče koje vire iz gabarita.
 */
export function proveriSklop(sklop: Sklop, postavljeni: PostavljenDeo[]): Nalaz[] {
  const gabarit = gabaritSklopa(sklop);
  const nalazi: Nalaz[] = [];

  for (let i = 0; i < postavljeni.length; i++) {
    for (let j = i + 1; j < postavljeni.length; j++) {
      const dubina = presek(postavljeni[i].kutija, postavljeni[j].kutija);
      if (dubina > 0) {
        nalazi.push({
          vrsta: 'preklapanje',
          a: postavljeni[i].deo.naziv || '—',
          b: postavljeni[j].deo.naziv || '—',
          dubina: Math.round(dubina * 10) / 10,
        });
      }
    }
  }

  for (const p of postavljeni) {
    const k = p.kutija;
    const viri =
      k.x < -DOZVOLJENO ||
      k.y < -DOZVOLJENO ||
      k.z < -DOZVOLJENO ||
      k.x + k.sx > gabarit.sirina + DOZVOLJENO ||
      k.y + k.sy > gabarit.visina + DOZVOLJENO ||
      k.z + k.sz > gabarit.dubina + DOZVOLJENO;
    if (viri) nalazi.push({ vrsta: 'van-gabarita', deo: p.deo.naziv || '—' });
  }

  return nalazi;
}
