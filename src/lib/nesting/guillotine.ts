import type {
  Nesmesten,
  Postavka,
  Pravougaonik,
  RasporedMaterijala,
  Tabla,
  TablaPlan,
  UlazniKomad,
} from './tipovi';

/**
 * Guillotine pakovanje pravougaonika.
 *
 * Svako postavljanje deli SVOJ slobodan pravougaonik jednim pravim rezom na
 * tačno dva nova. Slobodni pravougaonici se nikad ne spajaju — zato je svaki
 * rez u planu pravi rez od ivice do ivice, izvodljiv na formatnoj testeri.
 */

type PraviloDeljenja = 'kraci' | 'duzi';

/** Ispod ovoga ostatak nije upotrebljiv ni za šta — ne prijavljuje se. */
const PRAG_OSTATKA = 150;

function povrsina(r: Pravougaonik): number {
  return r.w * r.h;
}

/**
 * Deli slobodan pravougaonik posle postavljanja komada (w × h) u njegov
 * gornji levi ugao. Rez ide vodoravno ili uspravno — nikad oba.
 */
function podeli(
  r: Pravougaonik,
  w: number,
  h: number,
  kerf: number,
  pravilo: PraviloDeljenja,
): Pravougaonik[] {
  const ostatakW = r.w - w - kerf;
  const ostatakH = r.h - h - kerf;

  // „kraci" = režemo duž kraće preostale ose; klasična SplitShorterLeftoverAxis.
  const vodoravno = pravilo === 'kraci' ? ostatakW < ostatakH : ostatakW >= ostatakH;

  const novi: Pravougaonik[] = vodoravno
    ? [
        { x: r.x + w + kerf, y: r.y, w: ostatakW, h },
        { x: r.x, y: r.y + h + kerf, w: r.w, h: ostatakH },
      ]
    : [
        { x: r.x + w + kerf, y: r.y, w: ostatakW, h: r.h },
        { x: r.x, y: r.y + h + kerf, w, h: ostatakH },
      ];

  return novi.filter((n) => n.w > 0 && n.h > 0);
}

interface Smestaj {
  indeksPravougaonika: number;
  w: number;
  h: number;
  rotiran: boolean;
  ocena: number;
  ocena2: number;
}

/** Best Short Side Fit — bira pravougaonik gde ostaje najmanje uz kraću stranu. */
function najboljiSmestaj(
  komad: UlazniKomad,
  slobodni: Pravougaonik[],
): Smestaj | null {
  let najbolji: Smestaj | null = null;

  const orijentacije: [number, number, boolean][] = komad.rotacijaDozvoljena
    ? [
        [komad.duzina, komad.sirina, false],
        [komad.sirina, komad.duzina, true],
      ]
    : [[komad.duzina, komad.sirina, false]];

  for (let i = 0; i < slobodni.length; i++) {
    const r = slobodni[i];
    for (const [w, h, rotiran] of orijentacije) {
      if (w > r.w || h > r.h) continue;
      const viska = [r.w - w, r.h - h];
      const ocena = Math.min(viska[0], viska[1]);
      const ocena2 = Math.max(viska[0], viska[1]);
      if (
        najbolji === null ||
        ocena < najbolji.ocena ||
        (ocena === najbolji.ocena && ocena2 < najbolji.ocena2)
      ) {
        najbolji = { indeksPravougaonika: i, w, h, rotiran, ocena, ocena2 };
      }
    }
  }

  return najbolji;
}

/** Jedan prolaz: pakuje sve komade datim redosledom i pravilom deljenja. */
function spakuj(
  komadi: UlazniKomad[],
  tabla: Tabla,
  pravilo: PraviloDeljenja,
): TablaPlan[] {
  const table: TablaPlan[] = [];
  let preostali = [...komadi];
  const povrsinaTable = tabla.duzina * tabla.sirina;

  while (preostali.length > 0) {
    const slobodni: Pravougaonik[] = [
      {
        x: tabla.trim,
        y: tabla.trim,
        w: tabla.duzina - 2 * tabla.trim,
        h: tabla.sirina - 2 * tabla.trim,
      },
    ];
    const postavke: Postavka[] = [];
    const sledeciKrug: UlazniKomad[] = [];

    for (const komad of preostali) {
      const izbor = najboljiSmestaj(komad, slobodni);
      if (!izbor) {
        sledeciKrug.push(komad);
        continue;
      }

      const r = slobodni[izbor.indeksPravougaonika];
      postavke.push({
        deoId: komad.deoId,
        naziv: komad.naziv,
        redni: postavke.length + 1,
        x: r.x,
        y: r.y,
        w: izbor.w,
        h: izbor.h,
        rotiran: izbor.rotiran,
      });

      slobodni.splice(
        izbor.indeksPravougaonika,
        1,
        ...podeli(r, izbor.w, izbor.h, tabla.kerf, pravilo),
      );
    }

    // Ništa ne staje ni na praznu tablu — dalje bi bila beskonačna petlja.
    if (postavke.length === 0) break;

    const iskorisceno = postavke.reduce((z, p) => z + p.w * p.h, 0);
    table.push({
      redni: table.length + 1,
      postavke,
      iskoriscenje: iskorisceno / povrsinaTable,
      ostaci: slobodni
        .filter((r) => r.w >= PRAG_OSTATKA && r.h >= PRAG_OSTATKA)
        .sort((a, b) => povrsina(b) - povrsina(a)),
    });

    preostali = sledeciKrug;
  }

  return table;
}

/* ── Redosledi i nasumično mešanje ──────────────────────── */

function mulberry32(seme: number) {
  let a = seme >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function promesaj<T>(niz: T[], nasumicno: () => number): T[] {
  const kopija = [...niz];
  for (let i = kopija.length - 1; i > 0; i--) {
    const j = Math.floor(nasumicno() * (i + 1));
    [kopija[i], kopija[j]] = [kopija[j], kopija[i]];
  }
  return kopija;
}

const REDOSLEDI: ((a: UlazniKomad, b: UlazniKomad) => number)[] = [
  (a, b) => b.duzina * b.sirina - a.duzina * a.sirina,
  (a, b) => Math.max(b.duzina, b.sirina) - Math.max(a.duzina, a.sirina),
  (a, b) => b.duzina - a.duzina,
  (a, b) => b.sirina - a.sirina,
];

const PRAVILA: PraviloDeljenja[] = ['kraci', 'duzi'];

/* ── Javni ulaz ─────────────────────────────────────────── */

export interface OpcijeRasporeda {
  /** Broj nasumičnih pokušaja povrh determinističkih redosleda. */
  pokusaja?: number;
  onNapredak?: (urađeno: number, ukupno: number) => void;
}

function staneNaTablu(komad: UlazniKomad, tabla: Tabla): boolean {
  const l = tabla.duzina - 2 * tabla.trim;
  const w = tabla.sirina - 2 * tabla.trim;
  const uspravno = komad.duzina <= l && komad.sirina <= w;
  const polozeno = komad.rotacijaDozvoljena && komad.sirina <= l && komad.duzina <= w;
  return uspravno || polozeno;
}

/**
 * Računa raspored za jedan materijal. Pokreće algoritam više puta sa
 * različitim redosledima i pravilima deljenja i zadržava najbolji rezultat:
 * prvo manje tabli, pa veći upotrebljiv ostatak na poslednjoj tabli.
 */
export function izracunajRaspored(
  materijalId: string,
  komadi: UlazniKomad[],
  tabla: Tabla,
  opcije: OpcijeRasporeda = {},
): RasporedMaterijala {
  const nesmesteni: Nesmesten[] = [];
  const zaPakovanje: UlazniKomad[] = [];

  for (const k of komadi) {
    if (staneNaTablu(k, tabla)) zaPakovanje.push(k);
    else nesmesteni.push({ deoId: k.deoId, naziv: k.naziv, razlog: 'veci-od-table' });
  }

  const prazan: RasporedMaterijala = {
    materijalId,
    tabla,
    table: [],
    nesmesteni,
    iskoriscenje: 0,
    najveciOstatak: null,
  };
  if (zaPakovanje.length === 0) return prazan;

  const pokusaja = opcije.pokusaja ?? 60;
  const nasumicno = mulberry32(zaPakovanje.length * 7919 + 13);

  const varijante: UlazniKomad[][] = REDOSLEDI.map((cmp) => [...zaPakovanje].sort(cmp));
  for (let i = 0; i < pokusaja; i++) varijante.push(promesaj(zaPakovanje, nasumicno));

  const ukupnoProlaza = varijante.length * PRAVILA.length;
  let urađeno = 0;
  let najbolje: TablaPlan[] | null = null;
  let najboljiOstatak = -1;

  for (const varijanta of varijante) {
    for (const pravilo of PRAVILA) {
      const table = spakuj(varijanta, tabla, pravilo);
      urađeno++;
      if (table.length === 0) continue;

      const poslednja = table[table.length - 1];
      const ostatak = poslednja.ostaci.length > 0 ? povrsina(poslednja.ostaci[0]) : 0;

      const bolje =
        najbolje === null ||
        table.length < najbolje.length ||
        (table.length === najbolje.length && ostatak > najboljiOstatak);

      if (bolje) {
        najbolje = table;
        najboljiOstatak = ostatak;
      }
      if (urađeno % 16 === 0) opcije.onNapredak?.(urađeno, ukupnoProlaza);
    }
  }

  opcije.onNapredak?.(ukupnoProlaza, ukupnoProlaza);
  if (!najbolje) return prazan;

  // Komadi koje nijedan prolaz nije uspeo da smesti (ne bi trebalo, ali neka piše).
  const smesteno = najbolje.reduce((z, t) => z + t.postavke.length, 0);
  if (smesteno < zaPakovanje.length) {
    for (const k of zaPakovanje.slice(smesteno)) {
      nesmesteni.push({ deoId: k.deoId, naziv: k.naziv, razlog: 'veci-od-table' });
    }
  }

  const poslednja = najbolje[najbolje.length - 1];
  return {
    materijalId,
    tabla,
    table: najbolje,
    nesmesteni,
    iskoriscenje:
      najbolje.reduce((z, t) => z + t.iskoriscenje, 0) / najbolje.length,
    najveciOstatak: poslednja.ostaci.length > 0 ? poslednja.ostaci[0] : null,
  };
}
