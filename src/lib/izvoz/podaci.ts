import type { Deo, Projekat } from '../../types/domain';
import { IVICE } from '../../types/domain';

/** Jedan red krojne liste — isti podaci idu i u PDF i u CSV. */
export interface RedListe {
  sklop: string;
  naziv: string;
  materijal: string;
  duzina: number;
  sirina: number;
  kom: number;
  kant: Record<string, string>;
  tekstura: boolean;
  napomena: string;
}

export function redoviListe(projekat: Projekat): RedListe[] {
  const imeSklopa = (deo: Deo) =>
    projekat.sklopovi.find((s) => s.id === deo.sklopId)?.naziv ?? '';

  return projekat.delovi.map((deo) => {
    const kant: Record<string, string> = {};
    for (const ivica of IVICE) {
      const k = projekat.kantovi.find((x) => x.id === deo.kant[ivica]);
      kant[ivica] = k ? k.debljina.toLocaleString('sr-RS') : '';
    }
    return {
      sklop: imeSklopa(deo),
      naziv: deo.naziv || '—',
      materijal: projekat.materijali.find((m) => m.id === deo.materijalId)?.naziv ?? '—',
      duzina: deo.duzina,
      sirina: deo.sirina,
      kom: deo.kom,
      kant,
      tekstura: deo.teksturaZakljucana,
      napomena: deo.napomena,
    };
  });
}

/** Ime fajla bez dijakritika i razmaka — da se ne lomi po telefonima i mejlu. */
export function imeFajla(projekat: Projekat, nastavak: string): string {
  const mapa: Record<string, string> = {
    č: 'c', ć: 'c', š: 's', ž: 'z', đ: 'dj',
    Č: 'C', Ć: 'C', Š: 'S', Ž: 'Z', Đ: 'Dj',
  };
  const osnova = (projekat.naziv || 'krojna-lista')
    .replace(/[čćšžđČĆŠŽĐ]/g, (z) => mapa[z] ?? z)
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  return `${osnova || 'krojna-lista'}-${projekat.datum}.${nastavak}`;
}

export function preuzmi(sadrzaj: Blob, ime: string): void {
  const url = URL.createObjectURL(sadrzaj);
  const veza = document.createElement('a');
  veza.href = url;
  veza.download = ime;
  document.body.appendChild(veza);
  veza.click();
  veza.remove();
  // Odloženo, da preuzimanje stigne da počne.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
