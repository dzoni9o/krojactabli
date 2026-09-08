import type { Kantovanje, Materijal, Uid } from '../types/domain';
import type { Element, Okret } from '../types/elementi';

/** Kutija u prostoru sobe: X levo–desno, Y visina, Z od zida ka sobi. */
export interface Kutija {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
}

export interface GenerisanDeo {
  /** Stabilan ključ: element + uloga dela. */
  id: string;
  elementId: Uid;
  naziv: string;
  materijalId: Uid;
  /** Dužina ide u smeru teksture. */
  duzina: number;
  sirina: number;
  kom: number;
  kant: Kantovanje;
  teksturaZakljucana: boolean;
  /** Po jedna kutija za svaki komad, već postavljena u sobu. */
  kutije: Kutija[];
}

export interface KantoviZaGenerisanje {
  korpus: Uid | null;
  front: Uid | null;
}

/* ── Okretanje ──────────────────────────────────────────── */

/**
 * Okreće kutiju unutar gabarita elementa. Rotacija je oko uspravne ose,
 * u koracima od 90°, pa se dužina i dubina zamene na 90 i 270.
 */
function okreni(k: Kutija, W: number, D: number, okret: Okret): Kutija {
  switch (okret) {
    case 0:
      return k;
    case 90:
      return { ...k, x: D - k.z - k.sz, z: k.x, sx: k.sz, sz: k.sx };
    case 180:
      return { ...k, x: W - k.x - k.sx, z: D - k.z - k.sz };
    case 270:
      return { ...k, x: k.z, z: W - k.x - k.sx, sx: k.sz, sz: k.sx };
  }
}

/** Spoljni gabarit elementa na podu, posle okretanja. */
export function gabaritElementa(element: Element, debljinaFronta: number) {
  const dubinaSaFrontom = element.dubina + (element.imaFront ? debljinaFronta : 0);
  const uspravno = element.okret === 0 || element.okret === 180;
  return {
    sirina: uspravno ? element.sirina : dubinaSaFrontom,
    dubina: uspravno ? dubinaSaFrontom : element.sirina,
    visina: element.visina,
  };
}

/* ── Kantovanje ─────────────────────────────────────────── */

const BEZ_KANTA: Kantovanje = { L1: null, L2: null, W1: null, W2: null };

/** Prednja ivica je duža ivica ploče — nju vidiš kad je element zatvoren. */
function kantPrednjeIvice(kant: Uid | null): Kantovanje {
  return { ...BEZ_KANTA, L1: kant };
}

function kantUnaokolo(kant: Uid | null): Kantovanje {
  return { L1: kant, L2: kant, W1: kant, W2: kant };
}

/* ── Generisanje ────────────────────────────────────────── */

/** Polica je uvučena od prednje ivice da ne smeta frontu. */
const UVLACENJE_POLICE = 20;
/** Zazor fronta sa svake strane — 600 korpus daje 596 front. */
const ZAZOR_FRONTA = 2;
/** Razmak između dva fronta jedan iznad drugog. */
const RAZMAK_FRONTOVA = 4;

/**
 * Iz jednog elementa pravi sve njegove delove: mere, kantovanje i mesto u
 * prostoriji. Ovo je jedino mesto gde se odlučuje kako je korpus sklopljen.
 *
 * Sklop: bokovi idu spolja preko cele visine, pod i plafon staju između
 * njih, leđa se uglavljuju unutra, front prekriva korpus sa zazorom.
 */
export function generisiDelove(
  element: Element,
  materijali: Materijal[],
  kantovi: KantoviZaGenerisanje,
): GenerisanDeo[] {
  const nadjiDebljinu = (id: Uid, podrazumevana: number) =>
    materijali.find((m) => m.id === id)?.debljina ?? podrazumevana;

  const t = nadjiDebljinu(element.materijalKorpusa, 18);
  const tl = nadjiDebljinu(element.materijalLedja, 3);
  const tf = nadjiDebljinu(element.materijalFronta, 18);

  const { sirina: W, visina: H, dubina: D } = element;
  const dubinaSaFrontom = D + (element.imaFront ? tf : 0);
  const unutra = W - 2 * t;

  const delovi: GenerisanDeo[] = [];
  const dodaj = (
    kljuc: string,
    naziv: string,
    materijalId: Uid,
    duzina: number,
    sirina: number,
    kant: Kantovanje,
    kutije: Kutija[],
    teksturaZakljucana = false,
  ) => {
    if (duzina <= 0 || sirina <= 0 || kutije.length === 0) return;
    delovi.push({
      id: `${element.id}/${kljuc}`,
      elementId: element.id,
      naziv,
      materijalId,
      duzina: Math.round(duzina),
      sirina: Math.round(sirina),
      kom: kutije.length,
      kant,
      teksturaZakljucana,
      kutije: kutije.map((k) =>
        pomeriUSobu(okreni(k, W, dubinaSaFrontom, element.okret), element),
      ),
    });
  };

  // Bokovi — cela visina, cela dubina korpusa.
  dodaj(
    'bok',
    'bok',
    element.materijalKorpusa,
    H,
    D,
    kantPrednjeIvice(kantovi.korpus),
    [
      { x: 0, y: 0, z: 0, sx: t, sy: H, sz: D },
      { x: W - t, y: 0, z: 0, sx: t, sy: H, sz: D },
    ],
  );

  // Pod i plafon — između bokova.
  dodaj(
    'pod-plafon',
    'pod / plafon',
    element.materijalKorpusa,
    unutra,
    D,
    kantPrednjeIvice(kantovi.korpus),
    [
      { x: t, y: 0, z: 0, sx: unutra, sy: t, sz: D },
      { x: t, y: H - t, z: 0, sx: unutra, sy: t, sz: D },
    ],
  );

  // Police — razmaknute po visini unutrašnjeg otvora.
  if (element.brojPolica > 0) {
    const otvor = H - 2 * t;
    const dubinaPolice = D - UVLACENJE_POLICE - (element.imaLedja ? tl : 0);
    const kutije: Kutija[] = [];
    for (let i = 1; i <= element.brojPolica; i++) {
      const y = t + (otvor * i) / (element.brojPolica + 1) - t / 2;
      kutije.push({
        x: t,
        y,
        z: element.imaLedja ? tl : 0,
        sx: unutra,
        sy: t,
        sz: dubinaPolice,
      });
    }
    dodaj(
      'polica',
      'polica',
      element.materijalKorpusa,
      unutra,
      dubinaPolice,
      kantPrednjeIvice(kantovi.korpus),
      kutije,
    );
  }

  // Leđa — uglavljena unutar korpusa, uz zid.
  if (element.imaLedja) {
    dodaj(
      'ledja',
      'leđa',
      element.materijalLedja,
      H - 2 * t,
      unutra,
      BEZ_KANTA,
      [{ x: t, y: t, z: 0, sx: unutra, sy: H - 2 * t, sz: tl }],
    );
  }

  // Front — preko korpusa, sa zazorom; fioke ga dele po visini, krila po širini.
  if (element.imaFront) {
    const sirinaFronta = W - 2 * ZAZOR_FRONTA;
    const visinaFronta = H - 2 * ZAZOR_FRONTA;

    if (element.brojFioka > 0) {
      const n = element.brojFioka;
      const visinaJednog = (visinaFronta - (n - 1) * RAZMAK_FRONTOVA) / n;
      const kutije: Kutija[] = [];
      for (let i = 0; i < n; i++) {
        kutije.push({
          x: ZAZOR_FRONTA,
          y: ZAZOR_FRONTA + i * (visinaJednog + RAZMAK_FRONTOVA),
          z: D,
          sx: sirinaFronta,
          sy: visinaJednog,
          sz: tf,
        });
      }
      dodaj(
        'front',
        'front fioke',
        element.materijalFronta,
        visinaJednog,
        sirinaFronta,
        kantUnaokolo(kantovi.front),
        kutije,
        true,
      );
    } else {
      const n = Math.max(1, element.brojKrila);
      const sirinaKrila = (sirinaFronta - (n - 1) * RAZMAK_FRONTOVA) / n;
      const kutije: Kutija[] = [];
      for (let i = 0; i < n; i++) {
        kutije.push({
          x: ZAZOR_FRONTA + i * (sirinaKrila + RAZMAK_FRONTOVA),
          y: ZAZOR_FRONTA,
          z: D,
          sx: sirinaKrila,
          sy: visinaFronta,
          sz: tf,
        });
      }
      dodaj(
        'front',
        n > 1 ? 'front (krilo)' : 'front',
        element.materijalFronta,
        visinaFronta,
        sirinaKrila,
        kantUnaokolo(kantovi.front),
        kutije,
        true,
      );
    }
  }

  return delovi;
}

function pomeriUSobu(k: Kutija, element: Element): Kutija {
  return {
    ...k,
    x: k.x + element.x,
    y: k.y + element.podizanje,
    z: k.z + element.z,
  };
}

/** Svi delovi svih elemenata, spojeni — to ide u nesting i u krojnu listu. */
export function generisiSveDelove(
  elementi: Element[],
  materijali: Materijal[],
  kantovi: KantoviZaGenerisanje,
): GenerisanDeo[] {
  return elementi.flatMap((e) => generisiDelove(e, materijali, kantovi));
}
