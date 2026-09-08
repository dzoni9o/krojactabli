/// <reference lib="webworker" />
import { izracunajRaspored } from './guillotine';
import type { PosaoMaterijala } from './pripremi';
import type { RasporedMaterijala } from './tipovi';

export interface ZahtevRasporeda {
  tip: 'racunaj';
  poslovi: PosaoMaterijala[];
}

export type OdgovorRasporeda =
  | { tip: 'napredak'; materijalId: string; urađeno: number; ukupno: number }
  | { tip: 'gotovo'; rasporedi: RasporedMaterijala[]; trajanjeMs: number }
  | { tip: 'greska'; poruka: string };

self.onmessage = (e: MessageEvent<ZahtevRasporeda>) => {
  if (e.data.tip !== 'racunaj') return;
  const pocetak = performance.now();

  try {
    const rasporedi = e.data.poslovi.map((posao) =>
      izracunajRaspored(posao.materijalId, posao.komadi, posao.tabla, {
        onNapredak: (urađeno, ukupno) => {
          const poruka: OdgovorRasporeda = {
            tip: 'napredak',
            materijalId: posao.materijalId,
            urađeno,
            ukupno,
          };
          self.postMessage(poruka);
        },
      }),
    );
    const gotovo: OdgovorRasporeda = {
      tip: 'gotovo',
      rasporedi,
      trajanjeMs: Math.round(performance.now() - pocetak),
    };
    self.postMessage(gotovo);
  } catch (greska) {
    const poruka: OdgovorRasporeda = {
      tip: 'greska',
      poruka: greska instanceof Error ? greska.message : String(greska),
    };
    self.postMessage(poruka);
  }
};
