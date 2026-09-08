import { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useT } from '../i18n';
import { imeFajla, preuzmi } from '../lib/izvoz/podaci';
import { napraviCsv } from '../lib/izvoz/csv';
import type { RasporedMaterijala } from '../lib/nesting/tipovi';

/**
 * PDF se pravi tek na klik — font i jsPDF se učitavaju odvojeno, da ne
 * uspore prvo otvaranje aplikacije na telefonu.
 */
export function Izvoz({ rasporedi }: { rasporedi: RasporedMaterijala[] | null }) {
  const projekat = useProjectStore((s) => s.projekat);
  const t = useT();
  const [pravi, postaviPravi] = useState(false);
  const [greska, postaviGresku] = useState<string | null>(null);

  const naPdf = async () => {
    postaviPravi(true);
    postaviGresku(null);
    try {
      const { napraviPdf } = await import('../lib/izvoz/pdf');
      preuzmi(await napraviPdf(projekat, rasporedi), imeFajla(projekat, 'pdf'));
    } catch (e) {
      postaviGresku(e instanceof Error ? e.message : String(e));
    } finally {
      postaviPravi(false);
    }
  };

  const naCsv = () => preuzmi(napraviCsv(projekat), imeFajla(projekat, 'csv'));

  if (projekat.delovi.length === 0) return null;

  return (
    <>
      <div className="akcije">
        <button className="nv-btn nv-btn--primary" onClick={naPdf} disabled={pravi}>
          {pravi ? t('Pravim PDF…') : t('PDF krojna lista')}
        </button>
        <button className="nv-btn" onClick={naCsv}>
          CSV
        </button>
      </div>
      {greska && <div className="upozorenje">{greska}</div>}
    </>
  );
}
