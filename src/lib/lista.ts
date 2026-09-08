import type { Projekat, StavkaListe, Uid } from '../types/domain';
import { generisiSveDelove, type KantoviZaGenerisanje } from './generisi';

/**
 * Kant se ne bira po delu nego po ulozi: korpus dobija tanji, front deblji.
 * Tako majstor ne mora da klikće kantovanje na svakoj ploči.
 */
export function podrazumevaniKantovi(projekat: Projekat): KantoviZaGenerisanje {
  const poDebljini = [...projekat.kantovi].sort((a, b) => a.debljina - b.debljina);
  return {
    korpus: poDebljini[0]?.id ?? null,
    front: poDebljini[poDebljini.length - 1]?.id ?? null,
  };
}

/**
 * Krojna lista: delovi koje su dali elementi, plus ono što je dodato ručno.
 * Sve dalje — nesting, cena, PDF — radi sa ovim.
 */
export function stavkeListe(projekat: Projekat): StavkaListe[] {
  const kantovi = podrazumevaniKantovi(projekat);
  const imeElementa = new Map<Uid, string>(projekat.elementi.map((e) => [e.id, e.naziv]));

  const izElemenata: StavkaListe[] = generisiSveDelove(
    projekat.elementi,
    projekat.materijali,
    kantovi,
  ).map((d) => ({
    id: d.id,
    poreklo: imeElementa.get(d.elementId) ?? '',
    naziv: d.naziv,
    materijalId: d.materijalId,
    duzina: d.duzina,
    sirina: d.sirina,
    kom: d.kom,
    kant: d.kant,
    teksturaZakljucana: d.teksturaZakljucana,
    napomena: '',
  }));

  const rucni: StavkaListe[] = projekat.delovi.map((d) => ({
    id: d.id,
    poreklo: '',
    naziv: d.naziv || '—',
    materijalId: d.materijalId,
    duzina: d.duzina,
    sirina: d.sirina,
    kom: d.kom,
    kant: d.kant,
    teksturaZakljucana: d.teksturaZakljucana,
    napomena: d.napomena,
  }));

  return [...izElemenata, ...rucni];
}

/** Iste ploče iz raznih elemenata se spajaju u jedan red liste. */
export function sazmiStavke(stavke: StavkaListe[]): StavkaListe[] {
  const po = new Map<string, StavkaListe>();
  for (const s of stavke) {
    const kljuc = [
      s.naziv,
      s.materijalId,
      s.duzina,
      s.sirina,
      s.teksturaZakljucana,
      s.kant.L1,
      s.kant.L2,
      s.kant.W1,
      s.kant.W2,
    ].join('|');
    const postoji = po.get(kljuc);
    if (postoji) postoji.kom += s.kom;
    else po.set(kljuc, { ...s, poreklo: '' });
  }
  return [...po.values()];
}
