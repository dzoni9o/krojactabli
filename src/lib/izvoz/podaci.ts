import type { Materijal, Projekat, StavkaListe } from '../../types/domain';
import { IVICE } from '../../types/domain';

/** Jedan red krojne liste — isti podaci idu i u PDF i u CSV. */
export interface RedListe {
  poreklo: string;
  naziv: string;
  materijal: string;
  duzina: number;
  sirina: number;
  kom: number;
  kant: Record<string, string>;
  tekstura: boolean;
  napomena: string;
}

export function redoviListe(
  stavke: StavkaListe[],
  materijali: Materijal[],
  kantovi: Projekat['kantovi'],
): RedListe[] {
  return stavke.map((stavka) => {
    const kant: Record<string, string> = {};
    for (const ivica of IVICE) {
      const k = kantovi.find((x) => x.id === stavka.kant[ivica]);
      kant[ivica] = k ? k.debljina.toLocaleString('sr-RS') : '';
    }
    return {
      poreklo: stavka.poreklo,
      naziv: stavka.naziv || '—',
      materijal: materijali.find((m) => m.id === stavka.materijalId)?.naziv ?? '—',
      duzina: stavka.duzina,
      sirina: stavka.sirina,
      kom: stavka.kom,
      kant,
      tekstura: stavka.teksturaZakljucana,
      napomena: stavka.napomena,
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
