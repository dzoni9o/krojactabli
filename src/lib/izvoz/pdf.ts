import type { jsPDF } from 'jspdf';
import type autoTableFn from 'jspdf-autotable';
import type { Projekat } from '../../types/domain';
import type { RasporedMaterijala, TablaPlan } from '../nesting/tipovi';
import { broj, rezimeProjekta } from '../obracun';
import { redoviListe } from './podaci';

const MARGINA = 12;
/* Položena strana table: crtež levo, legenda u koloni desno. */
const CRTEZ_GORE = MARGINA + 13;
const CRTEZ_SIRINA = 180;
const CRTEZ_VISINA = 150;
const LEGENDA_X = MARGINA + CRTEZ_SIRINA + 8;
const SIVA: [number, number, number] = [90, 90, 90];
const CRNA: [number, number, number] = [26, 26, 26];

function uRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Svetlija varijanta boje materijala — na papiru mora ostati čitljiv tekst. */
function razblazi(rgb: [number, number, number], udeo: number): [number, number, number] {
  return rgb.map((v) => Math.round(v + (255 - v) * udeo)) as [number, number, number];
}

/**
 * Krojna lista kao PDF: naslovna sa sumom i tabelom delova, pa po jedna
 * položena strana za svaku tablu sa crtežom rasporeda i legendom.
 */
export async function napraviPdf(
  projekat: Projekat,
  rasporedi: RasporedMaterijala[] | null,
): Promise<Blob> {
  const [{ jsPDF }, { default: autoTable }, { robotoRegular }, { robotoBold }] =
    await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
      import('./fontovi/robotoRegular'),
      import('./fontovi/robotoBold'),
    ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', robotoBold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto', 'normal');

  const rezime = rezimeProjekta(projekat);

  /* ── Naslovna ─────────────────────────────────────────── */
  let y = MARGINA + 4;

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...CRNA);
  doc.text(projekat.naziv || 'Krojna lista', MARGINA, y);

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SIVA);
  y += 6;
  const podnaslov = [
    projekat.musterija && `Mušterija: ${projekat.musterija}`,
    `Datum: ${projekat.datum}`,
    `${rezime.ukupnoKomada} komada · ${broj(rezime.ukupnoM2, 2)} m²`,
  ]
    .filter(Boolean)
    .join('   ·   ');
  doc.text(podnaslov, MARGINA, y);

  y += 4;
  doc.setDrawColor(200);
  doc.line(MARGINA, y, 210 - MARGINA, y);
  y += 7;

  doc.setFontSize(8);
  doc.setTextColor(...SIVA);
  doc.text('Mera u listi je mera reza — kantovanje ne menja dimenziju ploče.', MARGINA, y);
  y += 7;

  /* ── Suma materijala ──────────────────────────────────── */
  const sumaRedovi: string[][] = rezime.poMaterijalu.map((s) => {
    const r = rasporedi?.find((x) => x.materijalId === s.materijal.id);
    return [
      s.materijal.naziv,
      `${s.komada}`,
      `${broj(s.m2, 2)} m²`,
      r ? `${r.table.length}` : '—',
      r ? `${broj(r.iskoriscenje * 100, 1)} %` : '—',
    ];
  });
  for (const s of rezime.poKantu) {
    sumaRedovi.push([s.kant.naziv, '', `${broj(s.metara, 1)} m`, '', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Materijal / kant', 'Kom', 'Količina', 'Tabli', 'Iskorišćenje']],
    body: sumaRedovi,
    theme: 'grid',
    styles: { font: 'Roboto', fontSize: 9, cellPadding: 2, textColor: CRNA },
    headStyles: { font: 'Roboto', fontStyle: 'bold', fillColor: [38, 38, 38], textColor: 255 },
    columnStyles: {
      1: { halign: 'right', cellWidth: 16 },
      2: { halign: 'right', cellWidth: 26 },
      3: { halign: 'right', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: MARGINA, right: MARGINA },
  });

  /* ── Krojna lista ─────────────────────────────────────── */
  const posleSume = krajTabele(doc);

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...CRNA);
  doc.text('KROJNA LISTA', MARGINA, posleSume + 10);

  autoTable(doc, {
    startY: posleSume + 13,
    head: [['#', 'Sklop', 'Deo', 'Materijal', 'Dužina', 'Širina', 'Kom', 'L1', 'L2', 'W1', 'W2']],
    body: redoviListe(projekat).map((r, i) => [
      `${i + 1}`,
      r.sklop,
      r.naziv + (r.tekstura ? ' *' : ''),
      r.materijal,
      `${r.duzina}`,
      `${r.sirina}`,
      `${r.kom}`,
      r.kant.L1,
      r.kant.L2,
      r.kant.W1,
      r.kant.W2,
    ]),
    theme: 'striped',
    styles: { font: 'Roboto', fontSize: 8, cellPadding: 1.6, textColor: CRNA },
    headStyles: { font: 'Roboto', fontStyle: 'bold', fillColor: [38, 38, 38], textColor: 255 },
    alternateRowStyles: { fillColor: [246, 246, 246] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'right' },
      4: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 11, halign: 'right' },
      7: { cellWidth: 9, halign: 'center' },
      8: { cellWidth: 9, halign: 'center' },
      9: { cellWidth: 9, halign: 'center' },
      10: { cellWidth: 9, halign: 'center' },
    },
    margin: { left: MARGINA, right: MARGINA },
  });

  const posleListe = krajTabele(doc);
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...SIVA);
  doc.text('* zaključana tekstura — deo se ne sme okretati', MARGINA, posleListe + 5);

  /* ── Table sa rasporedom ──────────────────────────────── */
  for (const raspored of rasporedi ?? []) {
    const materijal = projekat.materijali.find((m) => m.id === raspored.materijalId);
    const boja = razblazi(uRgb(materijal?.boja ?? '#888888'), 0.45);

    for (const plan of raspored.table) {
      doc.addPage([297, 210], 'landscape');
      nacrtajTablu(doc, plan, raspored, materijal?.naziv ?? '', boja);
      legendaTable(doc, autoTable, plan);
    }
  }

  /* ── Numeracija strana ────────────────────────────────── */
  const strana = doc.getNumberOfPages();
  for (let i = 1; i <= strana; i++) {
    doc.setPage(i);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...SIVA);
    const sirinaStrane = doc.internal.pageSize.getWidth();
    const visinaStrane = doc.internal.pageSize.getHeight();
    doc.text(
      `${projekat.naziv || 'Krojna lista'} · ${i}/${strana}`,
      sirinaStrane - MARGINA,
      visinaStrane - 6,
      { align: 'right' },
    );
  }

  return doc.output('blob');
}

type AutoTable = typeof autoTableFn;

/** jsPDF ne tipizira polje koje autotable dopisuje posle svake tabele. */
function krajTabele(doc: jsPDF): number {
  return (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function nacrtajTablu(
  doc: jsPDF,
  plan: TablaPlan,
  raspored: RasporedMaterijala,
  nazivMaterijala: string,
  boja: [number, number, number],
): void {
  const { tabla } = raspored;

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...CRNA);
  doc.text(
    `${nazivMaterijala} — tabla ${plan.redni}/${raspored.table.length}`,
    MARGINA,
    MARGINA + 4,
  );

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...SIVA);
  doc.text(
    `${tabla.duzina} × ${tabla.sirina} mm   ·   rez ${broj(tabla.kerf, 1)} mm   ·   ` +
      `obrez ${tabla.trim} mm   ·   iskorišćenje ${broj(plan.iskoriscenje * 100, 1)} %`,
    MARGINA,
    MARGINA + 9,
  );

  const razmera = Math.min(CRTEZ_SIRINA / tabla.duzina, CRTEZ_VISINA / tabla.sirina);
  const x0 = MARGINA;
  const y0 = CRTEZ_GORE;

  const mm = (v: number) => v * razmera;

  // cela tabla
  doc.setDrawColor(...CRNA);
  doc.setLineWidth(0.4);
  doc.rect(x0, y0, mm(tabla.duzina), mm(tabla.sirina));

  // obrez
  doc.setDrawColor(180);
  doc.setLineWidth(0.15);
  doc.rect(
    x0 + mm(tabla.trim),
    y0 + mm(tabla.trim),
    mm(tabla.duzina - 2 * tabla.trim),
    mm(tabla.sirina - 2 * tabla.trim),
  );

  for (const p of plan.postavke) {
    const px = x0 + mm(p.x);
    const py = y0 + mm(p.y);
    const pw = mm(p.w);
    const ph = mm(p.h);

    doc.setFillColor(...boja);
    doc.setDrawColor(...CRNA);
    doc.setLineWidth(0.25);
    doc.rect(px, py, pw, ph, 'FD');

    doc.setTextColor(...CRNA);
    if (pw > 7 && ph > 5) {
      doc.setFont('Roboto', 'bold');
      doc.setFontSize(Math.min(9, Math.max(5.5, Math.min(pw, ph) / 2.4)));
      doc.text(String(p.redni), px + pw / 2, py + ph / 2 + (pw > 16 && ph > 11 ? -0.6 : 1), {
        align: 'center',
      });
    }
    if (pw > 16 && ph > 11) {
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(5.5);
      const dl = Math.round(p.rotiran ? p.h : p.w);
      const sr = Math.round(p.rotiran ? p.w : p.h);
      doc.text(`${dl}×${sr}${p.rotiran ? ' R' : ''}`, px + pw / 2, py + ph / 2 + 3.4, {
        align: 'center',
      });
    }
  }

  // upotrebljivi ostaci
  doc.setDrawColor(120);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1.2, 1], 0);
  for (const o of plan.ostaci) {
    doc.rect(x0 + mm(o.x), y0 + mm(o.y), mm(o.w), mm(o.h));
    if (mm(o.w) > 22 && mm(o.h) > 8) {
      doc.setFont('Roboto', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(110);
      doc.text(
        `ostatak ${Math.round(o.w)}×${Math.round(o.h)}`,
        x0 + mm(o.x) + mm(o.w) / 2,
        y0 + mm(o.y) + mm(o.h) / 2 + 1,
        { align: 'center' },
      );
    }
  }
  doc.setLineDashPattern([], 0);
}

function legendaTable(doc: jsPDF, autoTable: AutoTable, plan: TablaPlan): void {
  autoTable(doc, {
    startY: CRTEZ_GORE,
    head: [['#', 'Deo', 'Mera']],
    body: plan.postavke.map((p) => [
      String(p.redni),
      p.naziv,
      `${Math.round(p.rotiran ? p.h : p.w)}×${Math.round(p.rotiran ? p.w : p.h)}${
        p.rotiran ? ' R' : ''
      }`,
    ]),
    theme: 'grid',
    styles: { font: 'Roboto', fontSize: 7, cellPadding: 1.1, textColor: CRNA },
    headStyles: { font: 'Roboto', fontStyle: 'bold', fillColor: [38, 38, 38], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'right' },
      2: { cellWidth: 24, halign: 'right' },
    },
    margin: { left: LEGENDA_X, right: MARGINA, top: CRTEZ_GORE },
  });

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...SIVA);
  doc.text('R = deo je okrenut za 90°', LEGENDA_X, CRTEZ_GORE - 3);
}
