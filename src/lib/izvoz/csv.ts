import type { Projekat } from '../../types/domain';
import { redoviListe } from './podaci';
import { sazmiStavke, stavkeListe } from '../lista';

function polje(v: string | number): string {
  const s = String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Tačka-zarez kao razdvajač i BOM na početku — tako srpski Excel otvara
 * fajl u kolonama i sa ispravnim slovima, bez uvoznog čarobnjaka.
 */
export function napraviCsv(projekat: Projekat): Blob {
  const zaglavlje = [
    'Element', 'Naziv', 'Materijal', 'Dužina', 'Širina', 'Komada',
    'Kant L1', 'Kant L2', 'Kant W1', 'Kant W2', 'Tekstura', 'Napomena',
  ];

  const redovi = redoviListe(
    sazmiStavke(stavkeListe(projekat)),
    projekat.materijali,
    projekat.kantovi,
  ).map((r) => [
    r.poreklo, r.naziv, r.materijal, r.duzina, r.sirina, r.kom,
    r.kant.L1, r.kant.L2, r.kant.W1, r.kant.W2,
    r.tekstura ? 'zaključana' : '', r.napomena,
  ]);

  const tekst = [zaglavlje, ...redovi].map((red) => red.map(polje).join(';')).join('\r\n');
  return new Blob(['﻿' + tekst], { type: 'text/csv;charset=utf-8' });
}
