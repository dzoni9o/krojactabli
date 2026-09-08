import { useEffect, useState } from 'react';
import type { Deo } from '../types/domain';
import { useProjectStore } from '../store/useProjectStore';
import { useUiStore } from '../store/useUiStore';
import { useT } from '../i18n';
import { Fioka } from '../components/Fioka';
import { Polje } from '../components/Polje';
import { Prekidac } from '../components/Prekidac';
import { KantIzbor } from '../components/KantIzbor';

/** Uređivanje jednog dela. Radi na lokalnoj kopiji — Otkaži zaista otkazuje. */
export function DeoIzmena({ deoId }: { deoId: string }) {
  const projekat = useProjectStore((s) => s.projekat);
  const izmeniDeo = useProjectStore((s) => s.izmeniDeo);
  const obrisiDeo = useProjectStore((s) => s.obrisiDeo);
  const duplirajDeo = useProjectStore((s) => s.duplirajDeo);
  const zatvori = useUiStore((s) => s.otvoriDeo);
  const t = useT();

  const izvor = projekat.delovi.find((d) => d.id === deoId);
  const [nacrt, postaviNacrt] = useState<Deo | null>(izvor ?? null);

  useEffect(() => {
    const d = projekat.delovi.find((x) => x.id === deoId);
    postaviNacrt(d ? { ...d, kant: { ...d.kant } } : null);
  }, [deoId, projekat.delovi]);

  if (!nacrt) return null;

  const promeni = <K extends keyof Deo>(kljuc: K, vrednost: Deo[K]) =>
    postaviNacrt({ ...nacrt, [kljuc]: vrednost });

  const sacuvaj = () => {
    izmeniDeo(deoId, nacrt);
    zatvori(null);
  };

  return (
    <Fioka
      naslov={nacrt.naziv || t('Dodatni deo')}
      onZatvori={() => zatvori(null)}
      podnozje={
        <>
          <button className="nv-btn" onClick={() => zatvori(null)}>
            {t('Otkaži')}
          </button>
          <button className="nv-btn nv-btn--primary" onClick={sacuvaj}>
            {t('Sačuvaj')}
          </button>
        </>
      }
    >
      <div className="polja" style={{ marginBottom: 14 }}>
        <Polje oznaka={t('Naziv')}>
          <input
            value={nacrt.naziv}
            placeholder="bok levi"
            onChange={(e) => promeni('naziv', e.target.value)}
          />
        </Polje>
      </div>

      <div className="polja" style={{ marginBottom: 14 }}>
        <Polje oznaka={`${t('Dužina')} (mm)`}>
          <input
            type="number"
            inputMode="numeric"
            value={nacrt.duzina || ''}
            onChange={(e) => promeni('duzina', Number(e.target.value) || 0)}
          />
        </Polje>
        <Polje oznaka={`${t('Širina')} (mm)`}>
          <input
            type="number"
            inputMode="numeric"
            value={nacrt.sirina || ''}
            onChange={(e) => promeni('sirina', Number(e.target.value) || 0)}
          />
        </Polje>
        <Polje oznaka={t('Komada')}>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={nacrt.kom}
            onChange={(e) => promeni('kom', Math.max(1, Number(e.target.value) || 1))}
          />
        </Polje>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Polje oznaka={t('Materijal')}>
          <select
            value={nacrt.materijalId}
            onChange={(e) => promeni('materijalId', e.target.value)}
          >
            {projekat.materijali.map((m) => (
              <option key={m.id} value={m.id}>
                {m.naziv}
              </option>
            ))}
          </select>
        </Polje>
      </div>

      <KantIzbor
        kant={nacrt.kant}
        kantovi={projekat.kantovi}
        duzina={nacrt.duzina}
        sirina={nacrt.sirina}
        onPromena={(k) => promeni('kant', k)}
      />

      <Prekidac
        ukljucen={nacrt.teksturaZakljucana}
        tekst={t('Zaključaj teksturu')}
        opis={t('Deo se ne sme rotirati za 90°')}
        onPromena={(v) => promeni('teksturaZakljucana', v)}
      />

      <div style={{ marginTop: 12 }}>
        <Polje oznaka={t('Napomena')}>
          <input value={nacrt.napomena} onChange={(e) => promeni('napomena', e.target.value)} />
        </Polje>
      </div>

      <div className="akcije">
        <button
          className="nv-btn nv-btn--ghost"
          onClick={() => {
            duplirajDeo(deoId);
            zatvori(null);
          }}
        >
          {t('Dupliraj')}
        </button>
        <button
          className="nv-btn nv-btn--ghost nv-btn--danger"
          onClick={() => {
            obrisiDeo(deoId);
            zatvori(null);
          }}
        >
          {t('Obriši')}
        </button>
      </div>
    </Fioka>
  );
}
