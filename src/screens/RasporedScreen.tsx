import { useEffect, useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { useReci, useT } from '../i18n';
import { useRaspored } from '../hooks/useRaspored';
import { TablaSvg } from '../components/TablaSvg';
import { Izvoz } from '../components/Izvoz';
import { broj } from '../lib/obracun';
import { dinara, obracunajCenu } from '../lib/cena';
import { delovaBezZakljucaneTeksture } from '../lib/nesting/pripremi';
import { sazmiStavke, stavkeListe } from '../lib/lista';
import type { RasporedMaterijala } from '../lib/nesting/tipovi';

function Materijal({ raspored }: { raspored: RasporedMaterijala }) {
  const projekat = useProjectStore((s) => s.projekat);
  const t = useT();
  const reci = useReci();
  const materijal = projekat.materijali.find((m) => m.id === raspored.materijalId);
  if (!materijal) return null;

  return (
    <section style={{ marginBottom: 28 }}>
      <div className="sec-naslov">
        <h2>{materijal.naziv}</h2>
        <span className="sec-naslov__crta" />
      </div>

      <div className="rezime" style={{ marginBottom: 14 }}>
        <div className="rezime__stavka">
          <div className="rezime__broj">{raspored.table.length}</div>
          <div className="rezime__oznaka">{reci.table(raspored.table.length)}</div>
        </div>
        <div className="rezime__stavka">
          <div className="rezime__broj">{broj(raspored.iskoriscenje * 100, 1)}%</div>
          <div className="rezime__oznaka">{t('Iskorišćenje')}</div>
        </div>
        <div className="rezime__stavka">
          <div className="rezime__broj">
            {raspored.najveciOstatak
              ? `${Math.round(raspored.najveciOstatak.w)}×${Math.round(raspored.najveciOstatak.h)}`
              : '—'}
          </div>
          <div className="rezime__oznaka">{t('Najveći ostatak')}</div>
        </div>
      </div>

      {raspored.nesmesteni.length > 0 && (
        <div className="upozorenje">
          <strong>{t('Ne staje na tablu')}</strong>
          <ul>
            {raspored.nesmesteni.map((n, i) => (
              <li key={i}>{n.naziv}</li>
            ))}
          </ul>
        </div>
      )}

      {raspored.table.map((plan) => (
        <div key={plan.redni} className="tabla">
          <div className="tabla__glava">
            <span className="tabla__naziv">
              {t('Tabla')} {plan.redni}/{raspored.table.length}
            </span>
            <span className="tabla__mera">
              {raspored.tabla.duzina} × {raspored.tabla.sirina} · {t('rez')}{' '}
              {broj(raspored.tabla.kerf, 1)}
            </span>
            <span className="app__spacer" />
            <span className="tabla__procenat">{broj(plan.iskoriscenje * 100, 1)}%</span>
          </div>
          <TablaSvg plan={plan} tabla={raspored.tabla} boja={materijal.boja} />
          <ol className="legenda">
            {plan.postavke.map((p) => (
              <li key={p.redni}>
                <span className="legenda__broj">{p.redni}</span>
                <span className="legenda__naziv">{p.naziv}</span>
                <span className="legenda__mera">
                  {Math.round(p.rotiran ? p.h : p.w)} × {Math.round(p.rotiran ? p.w : p.h)}
                  {p.rotiran && ' ↻'}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </section>
  );
}

function Cena({ rasporedi }: { rasporedi: RasporedMaterijala[] }) {
  const projekat = useProjectStore((s) => s.projekat);
  const t = useT();
  const obracun = obracunajCenu(projekat, rasporedi);
  if (obracun.stavke.length === 0) return null;

  return (
    <>
      <div className="sec-naslov">
        <h2>{t('Cena')}</h2>
        <span className="sec-naslov__crta" />
      </div>
      <div className="card">
        {obracun.stavke.map((s, i) => (
          <div key={i} className="red-stavka">
            <span>
              {s.naziv}
              <span style={{ color: 'var(--nv-text-faint)' }}> · {s.kolicina}</span>
            </span>
            <span className="red-stavka__vrednost">{dinara(s.iznos)}</span>
          </div>
        ))}
        <div className="red-stavka" style={{ borderTop: '1px solid var(--nv-line-strong)' }}>
          <strong>{t('Ukupno bez PDV-a')}</strong>
          <span className="red-stavka__vrednost">{dinara(obracun.ukupno)} RSD</span>
        </div>
      </div>
      {obracun.nepotpuno && (
        <p style={{ fontSize: 11, color: 'var(--nv-text-faint)', marginTop: -6 }}>
          {t('Fali cena za neke stavke')}
        </p>
      )}
    </>
  );
}

export function RasporedScreen() {
  const projekat = useProjectStore((s) => s.projekat);
  const t = useT();
  const reci = useReci();

  const stavke = useMemo(() => sazmiStavke(stavkeListe(projekat)), [projekat]);
  const { racuna, napredak, rasporedi, trajanjeMs, greska, izracunaj } = useRaspored(
    stavke,
    projekat.materijali,
  );

  const imaDelova = stavke.some((d) => d.duzina > 0 && d.sirina > 0);
  const bezZakljucane = delovaBezZakljucaneTeksture(stavke, projekat.materijali);

  // Prvi ulazak na ekran — odmah izračunaj, bez dodatnog klika.
  useEffect(() => {
    if (imaDelova && rasporedi === null && !racuna) izracunaj();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!imaDelova) {
    return (
      <div className="prazno">
        <h3>{t('Nema delova')}</h3>
        <p>{t('Unesi delove pa se raspored računa sam.')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="akcije" style={{ marginTop: 0, marginBottom: 14 }}>
        <button className="nv-btn nv-btn--primary" onClick={izracunaj} disabled={racuna}>
          {racuna ? t('Računam…') : t('Izračunaj ponovo')}
        </button>
        {!racuna && trajanjeMs > 0 && (
          <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--nv-text-faint)' }}>
            {trajanjeMs} ms
          </span>
        )}
      </div>

      {racuna && (
        <div className="traka">
          <div className="traka__punjenje" style={{ width: `${Math.round(napredak * 100)}%` }} />
        </div>
      )}

      {greska && <div className="upozorenje">{greska}</div>}

      {bezZakljucane > 0 && (
        <div className="upozorenje">
          <strong>
            {bezZakljucane} {reci.delovi(bezZakljucane)}{' '}
            {t('na materijalu sa teksturom nije zaključano')}
          </strong>
          <p style={{ margin: '6px 0 0' }}>{t('Nesting sme da ih okrene — furnir ide poprečno.')}</p>
        </div>
      )}

      {rasporedi?.map((r) => (
        <Materijal key={r.materijalId} raspored={r} />
      ))}

      {rasporedi && rasporedi.length > 0 && <Cena rasporedi={rasporedi} />}

      {rasporedi && rasporedi.length > 0 && (
        <>
          <div className="sec-naslov">
            <h2>{t('Izvoz')}</h2>
            <span className="sec-naslov__crta" />
          </div>
          <Izvoz rasporedi={rasporedi} />
        </>
      )}
    </>
  );
}
