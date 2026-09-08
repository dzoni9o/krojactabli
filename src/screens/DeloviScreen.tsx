import { useMemo } from 'react';
import type { StavkaListe } from '../types/domain';
import { IVICE } from '../types/domain';
import { useProjectStore } from '../store/useProjectStore';
import { useUiStore } from '../store/useUiStore';
import { useReci, useT } from '../i18n';
import { Polje } from '../components/Polje';
import { broj, rezimeStavki } from '../lib/obracun';
import { stavkeListe } from '../lib/lista';

function RedStavke({ stavka, naKlik }: { stavka: StavkaListe; naKlik?: () => void }) {
  const materijali = useProjectStore((s) => s.projekat.materijali);
  const t = useT();
  const materijal = materijali.find((m) => m.id === stavka.materijalId);
  const kantovanih = IVICE.filter((i) => stavka.kant[i]).length;

  const sadrzaj = (
    <>
      <span
        className="deo__tacka"
        style={{ background: materijal?.boja ?? 'var(--nv-line-strong)' }}
      />
      <span className="deo__glavno">
        <span className="deo__naziv">{stavka.naziv}</span>
        <span className="deo__meta">
          {materijal?.naziv ?? '—'}
          {kantovanih > 0 && (
            <>
              <span className="znak-kant" /> {kantovanih} {t('ivice')}
            </>
          )}
        </span>
      </span>
      <span>
        <span className="deo__mera">
          {stavka.duzina} × {stavka.sirina}
        </span>
        <span className="deo__kom" style={{ display: 'block' }}>
          {stavka.kom} {t('kom')}
        </span>
      </span>
    </>
  );

  return naKlik ? (
    <button className="deo" onClick={naKlik}>
      {sadrzaj}
    </button>
  ) : (
    <div className="deo">{sadrzaj}</div>
  );
}

export function DeloviScreen() {
  const projekat = useProjectStore((s) => s.projekat);
  const postaviProjekat = useProjectStore((s) => s.postaviProjekat);
  const dodajDeo = useProjectStore((s) => s.dodajDeo);
  const otvoriDeo = useUiStore((s) => s.otvoriDeo);
  const postaviEkran = useUiStore((s) => s.postaviEkran);
  const t = useT();
  const reci = useReci();

  const stavke = useMemo(() => stavkeListe(projekat), [projekat]);
  const rezime = useMemo(
    () => rezimeStavki(stavke, projekat.materijali, projekat.kantovi),
    [stavke, projekat.materijali, projekat.kantovi],
  );

  // Grupisano po elementu iz kog je deo ispao — tako majstor i gleda listu.
  const grupe = useMemo(() => {
    const po = new Map<string, StavkaListe[]>();
    for (const s of stavke.filter((x) => x.poreklo)) {
      const lista = po.get(s.poreklo) ?? [];
      lista.push(s);
      po.set(s.poreklo, lista);
    }
    return [...po.entries()];
  }, [stavke]);

  const rucni = stavke.filter((s) => !s.poreklo);

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

      {stavke.length === 0 ? (
        <div className="prazno">
          <h3>{t('Lista je prazna')}</h3>
          <p>{t('Krojna lista se pravi sama, iz elemenata u prostoru.')}</p>
          <div className="akcije" style={{ justifyContent: 'center' }}>
            <button className="nv-btn nv-btn--primary" onClick={() => postaviEkran('prostor')}>
              {t('Slaži elemente')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {grupe.map(([element, lista]) => (
            <div className="grupa" key={element}>
              <div className="grupa__glava">
                <span className="grupa__naziv">{element}</span>
                <span className="grupa__broj">
                  {lista.reduce((z, s) => z + s.kom, 0)} {t('kom')}
                </span>
              </div>
              {lista.map((s) => (
                <RedStavke key={s.id} stavka={s} />
              ))}
            </div>
          ))}

          {rucni.length > 0 && (
            <div className="grupa">
              <div className="grupa__glava">
                <span className="grupa__naziv">{t('Ručno dodato')}</span>
                <span className="grupa__broj">
                  {rucni.length} {reci.delovi(rucni.length)}
                </span>
              </div>
              {rucni.map((s) => (
                <RedStavke key={s.id} stavka={s} naKlik={() => otvoriDeo(s.id)} />
              ))}
            </div>
          )}

          <div className="akcije">
            <button className="nv-btn" onClick={() => otvoriDeo(dodajDeo())}>
              + {t('Dodatni deo')}
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
                {broj(
                  rezime.poKantu.reduce((z, s) => z + s.metara, 0),
                  1,
                )}
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
