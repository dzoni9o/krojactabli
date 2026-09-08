import { mnozinaSr } from '../lib/reci';
import { useUiStore } from '../store/useUiStore';

export type Jezik = 'sr' | 'en';

/** Ključevi su srpski tekst — najčitljivije u kodu, engleski je prevod. */
const en: Record<string, string> = {
  'Krojač tabli': 'Cutting list',
  Prostor: 'Space',
  Delovi: 'Parts',
  Prostorija: 'Room',
  'Prazna soba': 'Empty room',
  'Ubaci element dugmetom ispod. Dodirom ga biraš, vučenjem pomeraš.':
    'Add an element with a button below. Tap to select it, drag to move it.',
  'Dodirni da izabereš, pa vuci da pomeriš — sam se lepi za zid':
    'Tap to select, then drag to move — it snaps to the wall',
  ODOZGO: 'TOP',
  SOBA: 'ROOM',
  'Zidovi za koje se elementi lepe': 'Walls the elements snap to',
  'Donji element': 'Base cabinet',
  'Element sa fiokama': 'Drawer unit',
  'Viseći element': 'Wall cabinet',
  Plakar: 'Wardrobe',
  'Otvorena polica': 'Open shelving',
  'Od poda': 'Off floor',
  Polica: 'Shelves',
  Fioka: 'Drawers',
  Krila: 'Doors',
  'Ima front': 'Has door',
  'Ima leđa': 'Has back',
  Korpus: 'Carcass',
  Front: 'Door',
  'Leđa': 'Back',
  Okreni: 'Rotate',
  'Pogledaj ovo': 'Check this',
  'preklapaju se': 'overlap',
  'viri iz sobe': 'sticks out of the room',
  'Lista je prazna': 'The list is empty',
  'Krojna lista se pravi sama, iz elemenata u prostoru.':
    'The cutting list builds itself from the elements in the room.',
  'Slaži elemente': 'Place elements',
  'Ručno dodato': 'Added by hand',
  'Dodatni deo': 'Extra part',
  'Slaži elemente u prostoru pa se raspored računa sam.':
    'Place elements in the room and the layout is computed automatically.',
  Raspored: 'Layout',
  Materijali: 'Materials',
  'Novi deo': 'New part',
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
  preklapanje: 'overlap',
  Centriraj: 'Recenter',
  'BEZ MREŽE': 'OFFLINE',
  'Bez mreže — radi lokalno': 'Offline — running locally',
  'Nova verzija je spremna': 'A new version is ready',
  'Osveži': 'Reload',
  Kasnije: 'Later',
  'Spremno za rad bez mreže': 'Ready to work offline',
  'Cena po m': 'Price per m',
  Cena: 'Cost',
  'Ukupno bez PDV-a': 'Total, excl. VAT',
  'Fali cena za neke stavke': 'Some items have no price set',
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
