import { useCallback, useEffect, useRef, useState } from 'react';
import type { Materijal, StavkaListe } from '../types/domain';
import { pripremiPoslove } from '../lib/nesting/pripremi';
import type { OdgovorRasporeda, ZahtevRasporeda } from '../lib/nesting/worker';
import type { RasporedMaterijala } from '../lib/nesting/tipovi';

interface StanjeRasporeda {
  racuna: boolean;
  napredak: number;
  rasporedi: RasporedMaterijala[] | null;
  trajanjeMs: number;
  greska: string | null;
}

/**
 * Nesting ide u Web Worker — na 200 delova računanje traje dovoljno dugo
 * da bi blokiralo dodir na telefonu.
 */
export function useRaspored(stavke: StavkaListe[], materijali: Materijal[]) {
  const [stanje, postaviStanje] = useState<StanjeRasporeda>({
    racuna: false,
    napredak: 0,
    rasporedi: null,
    trajanjeMs: 0,
    greska: null,
  });
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('../lib/nesting/worker.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = (e: MessageEvent<OdgovorRasporeda>) => {
      const p = e.data;
      if (p.tip === 'napredak') {
        postaviStanje((s) => ({ ...s, napredak: p.urađeno / p.ukupno }));
      } else if (p.tip === 'gotovo') {
        postaviStanje({
          racuna: false,
          napredak: 1,
          rasporedi: p.rasporedi,
          trajanjeMs: p.trajanjeMs,
          greska: null,
        });
      } else {
        postaviStanje((s) => ({ ...s, racuna: false, greska: p.poruka }));
      }
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const izracunaj = useCallback(() => {
    const poslovi = pripremiPoslove(stavke, materijali);
    if (poslovi.length === 0) {
      postaviStanje({
        racuna: false,
        napredak: 0,
        rasporedi: [],
        trajanjeMs: 0,
        greska: null,
      });
      return;
    }
    postaviStanje((s) => ({ ...s, racuna: true, napredak: 0, greska: null }));
    const zahtev: ZahtevRasporeda = { tip: 'racunaj', poslovi };
    workerRef.current?.postMessage(zahtev);
  }, [stavke, materijali]);

  return { ...stanje, izracunaj };
}
