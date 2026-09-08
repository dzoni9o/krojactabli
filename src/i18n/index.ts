import { mnozinaSr } from '../lib/reci';
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
  tabli: 'boards',
  'Iskorišćenje': 'Utilization',
  'Najveći ostatak': 'Largest offcut',
  'Ne staje na tablu': 'Does not fit the board',
  rez: 'kerf',
  'Računam…': 'Computing…',
  'Izračunaj ponovo': 'Recalculate',
  'Unesi delove pa se raspored računa sam.': 'Add parts and the layout is computed automatically.',
  'na materijalu sa teksturom nije zaključano': 'on grained material are not locked',
  'Nesting sme da ih okrene — furnir ide poprečno.': 'Nesting may rotate them — the grain would run crosswise.',
  'Zaključaj sve': 'Lock all',
  Izvoz: 'Export',
  'PDF krojna lista': 'PDF cutting list',
  'Pravim PDF…': 'Building PDF…',
  Ravan: 'Plane',
  Horizontalno: 'Horizontal',
  Bok: 'Side',
  'Front / leđa': 'Front / back',
  'Levo–desno': 'Left–right',
  'Dole–gore': 'Bottom–top',
  'Napred–nazad': 'Front–back',
  Levo: 'Left',
  Desno: 'Right',
  Dole: 'Bottom',
  Gore: 'Top',
  Napred: 'Front',
  Nazad: 'Back',
  Sredina: 'Center',
  Pomak: 'Offset',
  'Skloni iz prostora': 'Remove from space',
  'Nema sklopova': 'No assemblies yet',
  'Sklop je jedan element — korpus, plakar, viseći. Delovi se slažu u njega.':
    'An assembly is one unit — a carcass, wardrobe, wall cabinet. Parts go into it.',
  'Prevuci za rotaciju · uštini za zum · dodirni ploču':
    'Drag to rotate · pinch to zoom · tap a panel',
  'Sklop se ne zatvara': 'The assembly does not close',
  preklapanje: 'overlap',
  'viri iz gabarita': 'sticks out of the overall size',
  'Nije u prostoru': 'Not placed yet',
  Postavi: 'Place',
  Centriraj: 'Recenter',
  Gabarit: 'Overall size',
  Visina: 'Height',
  Dubina: 'Depth',
};

export function recDelovi(n: number, jezik: Jezik): string {
  if (jezik === 'en') return n === 1 ? 'part' : 'parts';
  return mnozinaSr(n, ['deo', 'dela', 'delova']);
}

export function recTable(n: number, jezik: Jezik): string {
  if (jezik === 'en') return n === 1 ? 'board' : 'boards';
  return mnozinaSr(n, ['tabla', 'table', 'tabli']);
}

export function prevedi(kljuc: string, jezik: Jezik): string {
  if (jezik === 'sr') return kljuc;
  return en[kljuc] ?? kljuc;
}

/** t('Delovi') → 'Delovi' | 'Parts' */
export function useT() {
  const jezik = useUiStore((s) => s.jezik);
  return (kljuc: string) => prevedi(kljuc, jezik);
}

/** Reči koje se menjaju po broju — 1 deo, 2 dela, 5 delova. */
export function useReci() {
  const jezik = useUiStore((s) => s.jezik);
  return {
    delovi: (n: number) => recDelovi(n, jezik),
    table: (n: number) => recTable(n, jezik),
  };
}
