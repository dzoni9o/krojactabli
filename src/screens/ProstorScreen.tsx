import { useMemo, useState } from 'react';
import type { Element } from '../types/elementi';
import { KATALOG } from '../types/elementi';
import { useProjectStore } from '../store/useProjectStore';
import { useT } from '../i18n';
import { Polje } from '../components/Polje';
import { MeraUnos } from '../components/MeraUnos';
import { Prekidac } from '../components/Prekidac';
import { Scena3D, type ElementUProstoru, type Pogled } from '../components/Scena3D';
import { generisiDelove } from '../lib/generisi';
import { podrazumevaniKantovi } from '../lib/lista';
import { otisak, prilepi, proveriProstor } from '../lib/prostor';

function Brojac({
  oznaka,
  vrednost,
  min,
  max,
  onPromena,
}: {
  oznaka: string;
  vrednost: number;
  min: number;
  max: number;
  onPromena: (v: number) => void;
}) {
  return (
    <div>
      <span className="nv-label">{oznaka}</span>
      <div className="brojac">
        <button
          type="button"
          onClick={() => onPromena(Math.max(min, vrednost - 1))}
          disabled={vrednost <= min}
          aria-label="−"
        >
          −
        </button>
        <span className="brojac__broj">{vrednost}</span>
        <button
          type="button"
          onClick={() => onPromena(Math.min(max, vrednost + 1))}
          disabled={vrednost >= max}
          aria-label="+"
        >
          +
        </button>
      </div>
    </div>
  );
}

function PodesavanjeElementa({ element }: { element: Element }) {
  const izmeni = useProjectStore((s) => s.izmeniElement);
  const okreni = useProjectStore((s) => s.okreniElement);
  const dupliraj = useProjectStore((s) => s.duplirajElement);
  const obrisi = useProjectStore((s) => s.obrisiElement);
  const materijali = useProjectStore((s) => s.projekat.materijali);
  const t = useT();

  const mera = (kljuc: 'sirina' | 'visina' | 'dubina' | 'podizanje', oznaka: string) => (
    <MeraUnos
      oznaka={oznaka}
      vrednost={element[kljuc]}
      onPromena={(v) => izmeni(element.id, { [kljuc]: v })}
    />
  );

  return (
    <div className="card">
      <div className="sklop__glava">
        <input
          className="naslov-unos"
          value={element.naziv}
          onChange={(e) => izmeni(element.id, { naziv: e.target.value })}
          aria-label={t('Naziv')}
        />
        <span style={{ fontSize: 11, color: 'var(--nv-text-dim)', whiteSpace: 'nowrap' }}>
          {element.okret}°
        </span>
      </div>

      <div className="polja" style={{ marginBottom: 12 }}>
        {mera('sirina', `${t('Širina')} (mm)`)}
        {mera('visina', `${t('Visina')} (mm)`)}
        {mera('dubina', `${t('Dubina')} (mm)`)}
        {mera('podizanje', `${t('Od poda')} (mm)`)}
      </div>

      <div className="polja" style={{ marginBottom: 12 }}>
        <Brojac
          oznaka={t('Polica')}
          vrednost={element.brojPolica}
          min={0}
          max={12}
          onPromena={(brojPolica) => izmeni(element.id, { brojPolica })}
        />
        <Brojac
          oznaka={t('Fioka')}
          vrednost={element.brojFioka}
          min={0}
          max={8}
          onPromena={(brojFioka) => izmeni(element.id, { brojFioka })}
        />
        <Brojac
          oznaka={t('Krila')}
          vrednost={element.brojKrila}
          min={1}
          max={3}
          onPromena={(brojKrila) => izmeni(element.id, { brojKrila })}
        />
      </div>

      <Prekidac
        ukljucen={element.imaFront}
        tekst={t('Ima front')}
        onPromena={(imaFront) => izmeni(element.id, { imaFront })}
      />
      <Prekidac
        ukljucen={element.imaLedja}
        tekst={t('Ima leđa')}
        onPromena={(imaLedja) => izmeni(element.id, { imaLedja })}
      />

      <div className="polja" style={{ marginTop: 12 }}>
        <Polje oznaka={t('Korpus')}>
          <select
            value={element.materijalKorpusa}
            onChange={(e) => izmeni(element.id, { materijalKorpusa: e.target.value })}
          >
            {materijali.map((m) => (
              <option key={m.id} value={m.id}>
                {m.naziv}
              </option>
            ))}
          </select>
        </Polje>
        <Polje oznaka={t('Front')}>
          <select
            value={element.materijalFronta}
            onChange={(e) => izmeni(element.id, { materijalFronta: e.target.value })}
          >
            {materijali.map((m) => (
              <option key={m.id} value={m.id}>
                {m.naziv}
              </option>
            ))}
          </select>
        </Polje>
        <Polje oznaka={t('Leđa')}>
          <select
            value={element.materijalLedja}
            onChange={(e) => izmeni(element.id, { materijalLedja: e.target.value })}
          >
            {materijali.map((m) => (
              <option key={m.id} value={m.id}>
                {m.naziv}
              </option>
            ))}
          </select>
        </Polje>
      </div>

      <div className="akcije">
        <button className="nv-btn" onClick={() => okreni(element.id)}>
          ⟳ {t('Okreni')}
        </button>
        <button className="nv-btn nv-btn--ghost" onClick={() => dupliraj(element.id)}>
          ⧉ {t('Dupliraj')}
        </button>
        <button
          className="nv-btn nv-btn--ghost nv-btn--danger"
          onClick={() => obrisi(element.id)}
        >
          {t('Obriši')}
        </button>
      </div>
    </div>
  );
}

export function ProstorScreen() {
  const projekat = useProjectStore((s) => s.projekat);
  const postaviProstoriju = useProjectStore((s) => s.postaviProstoriju);
  const dodajElement = useProjectStore((s) => s.dodajElement);
  const pomeriElement = useProjectStore((s) => s.pomeriElement);
  const t = useT();

  const [izabranId, postaviIzabran] = useState<string | null>(null);
  const [pogled, postaviPogled] = useState<Pogled>('kosi');
  const [centriranje, postaviCentriranje] = useState(0);
  const [sobaOtvorena, postaviSobaOtvorena] = useState(false);

  const kantovi = useMemo(() => podrazumevaniKantovi(projekat), [projekat]);

  const uProstoru: ElementUProstoru[] = useMemo(
    () =>
      projekat.elementi.map((element) => ({
        element,
        kutije: generisiDelove(element, projekat.materijali, kantovi).flatMap((d) => {
          const boja = projekat.materijali.find((m) => m.id === d.materijalId)?.boja ?? '#8a8a8a';
          return d.kutije.map((k) => ({ k, boja }));
        }),
      })),
    [projekat.elementi, projekat.materijali, kantovi],
  );

  const debljinaFronta = (id: string) =>
    projekat.materijali.find((m) => m.id === id)?.debljina ?? 18;

  /** Vučenje: željena pozicija se propušta kroz lepljenje pa upisuje. */
  const naPomeranje = (id: string, zeljenoX: number, zeljenoZ: number) => {
    const element = projekat.elementi.find((e) => e.id === id);
    if (!element) return;
    const tf = debljinaFronta(element.materijalFronta);
    const ovaj = otisak(element, tf);
    const ostali = projekat.elementi
      .filter((e) => e.id !== id)
      .map((e) => otisak(e, debljinaFronta(e.materijalFronta)));
    const { x, z } = prilepi(zeljenoX, zeljenoZ, ovaj, ostali, projekat.prostorija);
    if (x !== element.x || z !== element.z) pomeriElement(id, x, z);
  };

  const nalazi = useMemo(
    () => proveriProstor(projekat.elementi, projekat.prostorija, 18),
    [projekat.elementi, projekat.prostorija],
  );

  const izabran = projekat.elementi.find((e) => e.id === izabranId) ?? null;

  return (
    <>
      <div className="scena scena--velika">
        <Scena3D
          prostorija={projekat.prostorija}
          elementi={uProstoru}
          izabranId={izabranId}
          pogled={pogled}
          centriranje={centriranje}
          onIzbor={postaviIzabran}
          onPomeri={naPomeranje}
          onKrajPomeranja={() => undefined}
        />

        <div className="scena__alatke">
          <button
            className={`scena__alat${pogled === 'kosi' ? ' scena__alat--on' : ''}`}
            onClick={() => postaviPogled('kosi')}
          >
            3D
          </button>
          <button
            className={`scena__alat${pogled === 'odozgo' ? ' scena__alat--on' : ''}`}
            onClick={() => postaviPogled('odozgo')}
          >
            {t('ODOZGO')}
          </button>
          <button
            className="scena__alat"
            onClick={() => postaviCentriranje((n) => n + 1)}
            aria-label={t('Centriraj')}
          >
            ⌖
          </button>
          <button
            className={`scena__alat${sobaOtvorena ? ' scena__alat--on' : ''}`}
            onClick={() => postaviSobaOtvorena((v) => !v)}
          >
            {t('SOBA')}
          </button>
        </div>

        {projekat.elementi.length === 0 && (
          <div className="scena__uputstvo">
            <strong>{t('Prazna soba')}</strong>
            <span>{t('Ubaci element dugmetom ispod. Dodirom ga biraš, vučenjem pomeraš.')}</span>
          </div>
        )}

        {projekat.elementi.length > 0 && (
          <span className="scena__uput">
            {t('Dodirni da izabereš, pa vuci da pomeriš — sam se lepi za zid')}
          </span>
        )}
      </div>

      {sobaOtvorena && (
        <div className="card">
          <div className="sklop__glava">
            <strong>{t('Prostorija')}</strong>
            <span style={{ fontSize: 11, color: 'var(--nv-text-dim)' }}>
              {t('Zidovi za koje se elementi lepe')}
            </span>
          </div>
          <div className="polja">
            <MeraUnos
              oznaka={`${t('Širina')} (mm)`}
              vrednost={projekat.prostorija.sirina}
              korak={100}
              min={500}
              onPromena={(sirina) => postaviProstoriju({ sirina })}
            />
            <MeraUnos
              oznaka={`${t('Dužina')} (mm)`}
              vrednost={projekat.prostorija.duzina}
              korak={100}
              min={500}
              onPromena={(duzina) => postaviProstoriju({ duzina })}
            />
            <MeraUnos
              oznaka={`${t('Visina')} (mm)`}
              vrednost={projekat.prostorija.visina}
              korak={100}
              min={1000}
              onPromena={(visina) => postaviProstoriju({ visina })}
            />
          </div>
        </div>
      )}

      {izabran && <PodesavanjeElementa element={izabran} />}

      <div className="katalog">
        {KATALOG.map((k) => (
          <button
            key={k.tip}
            className="katalog__stavka"
            onClick={() => postaviIzabran(dodajElement(k.tip))}
          >
            <span className="katalog__ikona">{k.ikona}</span>
            <span className="katalog__naziv">{t(k.naziv)}</span>
            <span className="katalog__mera">
              {k.sirina}×{k.visina}×{k.dubina}
            </span>
          </button>
        ))}
      </div>

      {nalazi.length > 0 && (
        <div className="upozorenje">
          <strong>{t('Pogledaj ovo')}</strong>
          <ul>
            {nalazi.map((n, i) => (
              <li key={i}>
                {n.vrsta === 'preklapanje'
                  ? `${n.a} ↔ ${n.b}: ${t('preklapaju se')}`
                  : `${n.a}: ${t('viri iz sobe')}`}
              </li>
            ))}
          </ul>
        </div>
      )}

    </>
  );
}
