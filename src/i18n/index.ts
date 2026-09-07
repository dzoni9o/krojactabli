import { useUiStore } from '../store/useUiStore';

export type Jezik = 'sr' | 'en';

/** Ključevi su srpski tekst — najčitljivije u kodu, engleski je prevod. */
const en: Record<string, string> = {
  'Krojač tabli': 'Cutting list',
  Delovi: 'Parts',
  Raspored: 'Layout',
  Sklop: 'Assembly',
  Materijali: 'Materials',
  'Novi deo': 'New part',
  'Novi sklop': 'New assembly',
  'Novi materijal': 'New material',
  Naziv: 'Name',
  Mušterija: 'Client',
  Projekat: 'Project',
  Dužina: 'Length',
  Širina: 'Width',
  Komada: 'Qty',
  kom: 'pcs',
  ivice: 'edges',
  Materijal: 'Material',
  Kantovanje: 'Edge banding',
  'Zaključaj teksturu': 'Lock grain',
  'Deo se ne sme rotirati za 90°': 'Part may not be rotated 90°',
  Napomena: 'Note',
  Sačuvaj: 'Save',
  Otkaži: 'Cancel',
  Obriši: 'Delete',
  Dupliraj: 'Duplicate',
  Izmeni: 'Edit',
  'Bez sklopa': 'No assembly',
  'Nema delova': 'No parts yet',
  'Dodaj prvi deo i krojna lista počinje.': 'Add the first part and the cutting list begins.',
  Ukupno: 'Total',
  delova: 'parts',
  'Metara kanta': 'Edge banding',
  Debljina: 'Thickness',
  Tabla: 'Board',
  Rez: 'Kerf',
  Obrez: 'Trim',
  'Ima teksturu': 'Has grain',
  'Cena po m²': 'Price per m²',
  'Uskoro — faza': 'Coming — phase',
  'Raspored delova po tablama, guillotine rez.':
    'Part layout across boards, guillotine cuts.',
  'Sklapanje korpusa u 3D prostoru.': 'Assembling the cabinet in 3D space.',
  'Mera koju uneseš je i mera reza.': 'The size you enter is the cut size.',
  'Materijal se koristi u delovima': 'Material is used by parts',
  Sklopovi: 'Assemblies',
  Gabarit: 'Overall size',
  Visina: 'Height',
  Dubina: 'Depth',
};

export function prevedi(kljuc: string, jezik: Jezik): string {
  if (jezik === 'sr') return kljuc;
  return en[kljuc] ?? kljuc;
}

/** t('Delovi') → 'Delovi' | 'Parts' */
export function useT() {
  const jezik = useUiStore((s) => s.jezik);
  return (kljuc: string) => prevedi(kljuc, jezik);
}
