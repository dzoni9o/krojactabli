import type { Deo, Sklop } from '../types/domain';
import { useProjectStore } from '../store/useProjectStore';
import { useUiStore } from '../store/useUiStore';
import { useT } from '../i18n';
import { Polje } from '../components/Polje';
import { broj, rezimeProjekta } from '../lib/obracun';
import { IVICE } from '../types/domain';

function brojKantovanihIvica(deo: Deo): number {
  return IVICE.filter((i) => deo.kant[i]).length;
}

function RedDela({ deo }: { deo: Deo }) {
  const projekat = useProjectStore((s) => s.projekat);
  const otvoriDeo = useUiStore((s) => s.otvoriDeo);
  const t = useT();

  const materijal = projekat.materijali.find((m) => m.id === deo.materijalId);
  const kantovanih = brojKantovanihIvica(deo);

  return (
    <button className="deo" onClick={() => otvoriDeo(deo.id)}>
      <span
        className="deo__tacka"
        style={{ background: materijal?.boja ?? 'var(--nv-line-strong)' }}
      />
      <span className="deo__glavno">
        <span className={`deo__naziv${deo.naziv ? '' : ' deo__naziv--prazan'}`}>
          {deo.naziv || t('Novi deo')}
        </span>
        <span className="deo__meta">
          {materijal?.naziv ?? '—'}
          {kantovanih > 0 && (
            <>
              <span className="znak-kant" /> {kantovanih} {t('ivice')}
            </>
          )}
          {deo.teksturaZakljucana && ' · ↕'}
        </span>
      </span>
      <span>
        <span className="deo__mera">
          {deo.duzina || '—'} × {deo.sirina || '—'}
        </span>
        <span className="deo__kom" style={{ display: 'block' }}>
          {deo.kom} {t('kom')}
        </span>
      </span>
    </button>
  );
}

function Grupa({ sklop, delovi }: { sklop: Sklop | null; delovi: Deo[] }) {
  const t = useT();
  const dodajDeo = useProjectStore((s) => s.dodajDeo);
  const obrisiSklop = useProjectStore((s) => s.obrisiSklop);
  const otvoriDeo = useUiStore((s) => s.otvoriDeo);

  if (!sklop && delovi.length === 0) return null;

  return (
    <div className="grupa">
      <div className="grupa__glava">
        <span className="grupa__naziv">{sklop ? sklop.naziv : t('Bez sklopa')}</span>
        <span className="grupa__broj">
          {delovi.length} {t('delova')}
        </span>
        <span className="app__spacer" />
        <button
          className="nv-btn nv-btn--ghost"
          style={{ minHeight: 32, padding: '0 10px' }}
          onClick={() => otvoriDeo(dodajDeo({ sklopId: sklop?.id ?? null }))}
        >
          +
        </button>
        {sklop && (
          <button
            className="nv-btn nv-btn--ghost nv-btn--danger"
            style={{ minHeight: 32, padding: '0 10px' }}
            onClick={() => obrisiSklop(sklop.id)}
            aria-label={t('Obriši')}
          >
            ✕
          </button>
        )}
      </div>
      {delovi.map((d) => (
        <RedDela key={d.id} deo={d} />
      ))}
    </div>
  );
}

export function DeloviScreen() {
  const projekat = useProjectStore((s) => s.projekat);
  const postaviProjekat = useProjectStore((s) => s.postaviProjekat);
  const dodajDeo = useProjectStore((s) => s.dodajDeo);
  const dodajSklop = useProjectStore((s) => s.dodajSklop);
  const otvoriDeo = useUiStore((s) => s.otvoriDeo);
  const t = useT();

  const rezime = rezimeProjekta(projekat);
  const bezSklopa = projekat.delovi.filter((d) => d.sklopId === null);

  const noviSklop = () => {
    const redni = projekat.sklopovi.length + 1;
    dodajSklop(`${t('Sklop')} ${redni}`);
  };

  return (
    <>
      <div className="card">
        <div className="polja">
          <Polje oznaka={t('Projekat')}>
            <input
              value={projekat.naziv}
              onChange={(e) => postaviProjekat({ naziv: e.target.value })}
            />
          </Polje>
          <Polje oznaka={t('Mušterija')}>
            <input
              value={projekat.musterija}
              placeholder="—"
              onChange={(e) => postaviProjekat({ musterija: e.target.value })}
            />
          </Polje>
        </div>
      </div>

      {projekat.delovi.length === 0 && projekat.sklopovi.length === 0 ? (
        <div className="prazno">
          <h3>{t('Nema delova')}</h3>
          <p>{t('Dodaj prvi deo i krojna lista počinje.')}</p>
          <div className="akcije" style={{ justifyContent: 'center' }}>
            <button className="nv-btn nv-btn--primary" onClick={() => otvoriDeo(dodajDeo())}>
              + {t('Novi deo')}
            </button>
            <button className="nv-btn" onClick={noviSklop}>
              + {t('Novi sklop')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {projekat.sklopovi.map((s) => (
            <Grupa
              key={s.id}
              sklop={s}
              delovi={projekat.delovi.filter((d) => d.sklopId === s.id)}
            />
          ))}
          <Grupa sklop={null} delovi={bezSklopa} />

          <div className="akcije">
            <button className="nv-btn nv-btn--primary" onClick={() => otvoriDeo(dodajDeo())}>
              + {t('Novi deo')}
            </button>
            <button className="nv-btn" onClick={noviSklop}>
              + {t('Novi sklop')}
            </button>
          </div>

          <div className="sec-naslov">
            <h2>{t('Ukupno')}</h2>
            <span className="sec-naslov__crta" />
          </div>

          <div className="rezime">
            <div className="rezime__stavka">
              <div className="rezime__broj">{rezime.ukupnoKomada}</div>
              <div className="rezime__oznaka">{t('kom')}</div>
            </div>
            <div className="rezime__stavka">
              <div className="rezime__broj">{broj(rezime.ukupnoM2, 2)}</div>
              <div className="rezime__oznaka">m²</div>
            </div>
            <div className="rezime__stavka">
              <div className="rezime__broj">
                {broj(rezime.poKantu.reduce((z, s) => z + s.metara, 0), 1)}
              </div>
              <div className="rezime__oznaka">{t('Metara kanta')}</div>
            </div>
          </div>

          {rezime.poMaterijalu.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              {rezime.poMaterijalu.map((s) => (
                <div key={s.materijal.id} className="red-stavka">
                  <span>{s.materijal.naziv}</span>
                  <span className="red-stavka__vrednost">
                    {s.komada} {t('kom')} · {broj(s.m2, 2)} m²
                  </span>
                </div>
              ))}
              {rezime.poKantu.map((s) => (
                <div key={s.kant.id} className="red-stavka">
                  <span>{s.kant.naziv}</span>
                  <span className="red-stavka__vrednost">{broj(s.metara, 1)} m</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
