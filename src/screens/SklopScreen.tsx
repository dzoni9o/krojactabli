import { useMemo, useState } from 'react';
import type { Deo, Poravnanje, Ravan } from '../types/domain';
import { RAVNI } from '../types/domain';
import { useProjectStore } from '../store/useProjectStore';
import { useT } from '../i18n';
import { Polje } from '../components/Polje';
import { Sklop3D } from '../components/Sklop3D';
import { gabaritSklopa, postavljeniDelovi, proveriSklop } from '../lib/sklop';

const NAZIV_RAVNI: Record<Ravan, string> = {
  horizontala: 'Horizontalno',
  bok: 'Bok',
  front: 'Front / leđa',
};

const OSE: { osa: 'X' | 'Y' | 'Z'; naziv: string; oznake: [string, string, string] }[] = [
  { osa: 'X', naziv: 'Levo–desno', oznake: ['Levo', 'Sredina', 'Desno'] },
  { osa: 'Y', naziv: 'Dole–gore', oznake: ['Dole', 'Sredina', 'Gore'] },
  { osa: 'Z', naziv: 'Napred–nazad', oznake: ['Napred', 'Sredina', 'Nazad'] },
];

const PORAVNANJA: Poravnanje[] = ['pocetak', 'sredina', 'kraj'];

function Segmenti<T extends string>({
  vrednosti,
  oznake,
  izabrano,
  onIzbor,
}: {
  vrednosti: T[];
  oznake: string[];
  izabrano: T;
  onIzbor: (v: T) => void;
}) {
  return (
    <div className="segmenti">
      {vrednosti.map((v, i) => (
        <button
          key={v}
          type="button"
          className={`segment${v === izabrano ? ' segment--on' : ''}`}
          onClick={() => onIzbor(v)}
        >
          {oznake[i]}
        </button>
      ))}
    </div>
  );
}

function Postavljanje({ deo }: { deo: Deo }) {
  const postaviPolozaj = useProjectStore((s) => s.postaviPolozaj);
  const ukloni = useProjectStore((s) => s.ukloniIzProstora);
  const t = useT();
  const p = deo.polozaj;
  if (!p) return null;

  return (
    <div className="card">
      <div className="sklop__glava">
        <strong>{deo.naziv || t('Novi deo')}</strong>
        <span style={{ color: 'var(--nv-text-dim)', fontSize: 11 }}>
          {deo.duzina} × {deo.sirina}
        </span>
      </div>

      <div style={{ marginBottom: 12 }}>
        <span className="nv-label">{t('Ravan')}</span>
        <Segmenti
          vrednosti={RAVNI}
          oznake={RAVNI.map((r) => t(NAZIV_RAVNI[r]))}
          izabrano={p.ravan}
          onIzbor={(ravan) => postaviPolozaj(deo.id, { ravan })}
        />
      </div>

      {OSE.map(({ osa, naziv, oznake }) => {
        const kljucPoravnanja = `poravnanje${osa}` as const;
        const kljucPomaka = `pomak${osa}` as const;
        return (
          <div key={osa} className="sklop__osa">
            <span className="nv-label">{t(naziv)}</span>
            <Segmenti
              vrednosti={PORAVNANJA}
              oznake={oznake.map((o) => t(o))}
              izabrano={p[kljucPoravnanja]}
              onIzbor={(v) => postaviPolozaj(deo.id, { [kljucPoravnanja]: v })}
            />
            <Polje oznaka={`${t('Pomak')} (mm)`}>
              <input
                type="number"
                inputMode="numeric"
                value={p[kljucPomaka] || ''}
                onChange={(e) =>
                  postaviPolozaj(deo.id, { [kljucPomaka]: Number(e.target.value) || 0 })
                }
              />
            </Polje>
          </div>
        );
      })}

      <div className="akcije">
        <button className="nv-btn nv-btn--ghost" onClick={() => ukloni(deo.id)}>
          {t('Skloni iz prostora')}
        </button>
      </div>
    </div>
  );
}

export function SklopScreen() {
  const projekat = useProjectStore((s) => s.projekat);
  const izmeniSklop = useProjectStore((s) => s.izmeniSklop);
  const dodajSklop = useProjectStore((s) => s.dodajSklop);
  const postaviPolozaj = useProjectStore((s) => s.postaviPolozaj);
  const t = useT();

  const [sklopId, postaviSklopId] = useState<string | null>(
    projekat.sklopovi[0]?.id ?? null,
  );
  const [izabranId, postaviIzabran] = useState<string | null>(null);
  const [centriranje, postaviCentriranje] = useState(0);

  const sklop = projekat.sklopovi.find((s) => s.id === sklopId) ?? projekat.sklopovi[0] ?? null;

  const { gabarit, postavljeni, nalazi, nepostavljeni } = useMemo(() => {
    if (!sklop) {
      return { gabarit: null, postavljeni: [], nalazi: [], nepostavljeni: [] };
    }
    const postavljeni = postavljeniDelovi(sklop, projekat.delovi, projekat.materijali);
    return {
      gabarit: gabaritSklopa(sklop),
      postavljeni,
      nalazi: proveriSklop(sklop, postavljeni),
      nepostavljeni: projekat.delovi.filter((d) => d.sklopId === sklop.id && !d.polozaj),
    };
  }, [sklop, projekat.delovi, projekat.materijali]);

  if (!sklop || !gabarit) {
    return (
      <div className="prazno">
        <h3>{t('Nema sklopova')}</h3>
        <p>{t('Sklop je jedan element — korpus, plakar, viseći. Delovi se slažu u njega.')}</p>
        <div className="akcije" style={{ justifyContent: 'center' }}>
          <button
            className="nv-btn nv-btn--primary"
            onClick={() => postaviSklopId(dodajSklop(`${t('Sklop')} 1`))}
          >
            + {t('Novi sklop')}
          </button>
        </div>
      </div>
    );
  }

  const izabran = projekat.delovi.find((d) => d.id === izabranId) ?? null;

  return (
    <>
      {projekat.sklopovi.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <Polje oznaka={t('Sklop')}>
            <select value={sklop.id} onChange={(e) => postaviSklopId(e.target.value)}>
              {projekat.sklopovi.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.naziv}
                </option>
              ))}
            </select>
          </Polje>
        </div>
      )}

      <div className="card">
        <span className="nv-label">{t('Gabarit')} (mm)</span>
        <div className="polja">
          <Polje oznaka={t('Širina')}>
            <input
              type="number"
              inputMode="numeric"
              value={gabarit.sirina}
              onChange={(e) => izmeniSklop(sklop.id, { sirina: Number(e.target.value) || 0 })}
            />
          </Polje>
          <Polje oznaka={t('Visina')}>
            <input
              type="number"
              inputMode="numeric"
              value={gabarit.visina}
              onChange={(e) => izmeniSklop(sklop.id, { visina: Number(e.target.value) || 0 })}
            />
          </Polje>
          <Polje oznaka={t('Dubina')}>
            <input
              type="number"
              inputMode="numeric"
              value={gabarit.dubina}
              onChange={(e) => izmeniSklop(sklop.id, { dubina: Number(e.target.value) || 0 })}
            />
          </Polje>
        </div>
      </div>

      <div className="scena">
        <Sklop3D
          gabarit={gabarit}
          delovi={postavljeni}
          izabranId={izabranId}
          centriranje={centriranje}
          onIzbor={postaviIzabran}
        />
        <span className="scena__uput">{t('Prevuci za rotaciju · uštini za zum · dodirni ploču')}</span>
        <button
          className="scena__centar"
          onClick={() => postaviCentriranje((n) => n + 1)}
          title={t('Centriraj')}
          aria-label={t('Centriraj')}
        >
          ⌖
        </button>
      </div>

      {nalazi.length > 0 && (
        <div className="upozorenje">
          <strong>{t('Sklop se ne zatvara')}</strong>
          <ul>
            {nalazi.map((n, i) => (
              <li key={i}>
                {n.vrsta === 'preklapanje'
                  ? `${n.a} ↔ ${n.b}: ${t('preklapanje')} ${n.dubina} mm`
                  : `${n.deo}: ${t('viri iz gabarita')}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {izabran && <Postavljanje deo={izabran} />}

      {nepostavljeni.length > 0 && (
        <>
          <div className="sec-naslov">
            <h2>{t('Nije u prostoru')}</h2>
            <span className="sec-naslov__crta" />
          </div>
          {nepostavljeni.map((d) => (
            <button
              key={d.id}
              className="deo"
              onClick={() => {
                postaviPolozaj(d.id, {});
                postaviIzabran(d.id);
              }}
            >
              <span className="deo__glavno">
                <span className={`deo__naziv${d.naziv ? '' : ' deo__naziv--prazan'}`}>
                  {d.naziv || t('Novi deo')}
                </span>
                <span className="deo__meta">
                  {d.duzina} × {d.sirina} · {d.kom} {t('kom')}
                </span>
              </span>
              <span className="nv-btn nv-btn--ghost" style={{ minHeight: 32, padding: '0 12px' }}>
                {t('Postavi')}
              </span>
            </button>
          ))}
        </>
      )}
    </>
  );
}
