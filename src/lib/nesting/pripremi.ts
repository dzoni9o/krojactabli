import type { Materijal, StavkaListe } from '../../types/domain';
import type { Tabla, UlazniKomad } from './tipovi';

export interface PosaoMaterijala {
  materijalId: string;
  tabla: Tabla;
  komadi: UlazniKomad[];
}

/**
 * Razlaže projekat u poslove po materijalu. Delovi svih sklopova se spajaju —
 * cela kuhinja se seče zajedno, ne element po element.
 */
export function pripremiPoslove(
  stavke: StavkaListe[],
  materijali: Materijal[],
): PosaoMaterijala[] {
  const poMaterijalu = new Map<string, PosaoMaterijala>();

  for (const deo of stavke) {
    if (deo.duzina <= 0 || deo.sirina <= 0 || deo.kom <= 0) continue;
    const materijal = materijali.find((m) => m.id === deo.materijalId);
    if (!materijal) continue;

    let posao = poMaterijalu.get(materijal.id);
    if (!posao) {
      posao = {
        materijalId: materijal.id,
        tabla: {
          duzina: materijal.tablaL,
          sirina: materijal.tablaW,
          kerf: materijal.kerf,
          trim: materijal.trim,
        },
        komadi: [],
      };
      poMaterijalu.set(materijal.id, posao);
    }

    for (let i = 0; i < deo.kom; i++) {
      posao.komadi.push({
        deoId: deo.id,
        naziv: deo.naziv || '—',
        duzina: deo.duzina,
        sirina: deo.sirina,
        rotacijaDozvoljena: !deo.teksturaZakljucana,
      });
    }
  }

  return [...poMaterijalu.values()];
}

/**
 * Delovi na materijalu sa teksturom kojima rotacija nije zabranjena.
 * Nesting sme da ih okrene — a furnir onda ide poprečno.
 */
export function delovaBezZakljucaneTeksture(
  stavke: StavkaListe[],
  materijali: Materijal[],
): number {
  return stavke.filter((d) => {
    const m = materijali.find((x) => x.id === d.materijalId);
    return m?.imaTeksturu && !d.teksturaZakljucana;
  }).length;
}
