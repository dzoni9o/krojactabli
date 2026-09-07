import type { Materijal } from '../types/domain';
import { useProjectStore } from '../store/useProjectStore';
import { useT } from '../i18n';
import { Polje } from '../components/Polje';
import { Prekidac } from '../components/Prekidac';

function MaterijalKartica({ materijal }: { materijal: Materijal }) {
  const izmeni = useProjectStore((s) => s.izmeniMaterijal);
  const obrisi = useProjectStore((s) => s.obrisiMaterijal);
  const delovi = useProjectStore((s) => s.projekat.delovi);
  const t = useT();

  const uUpotrebi = delovi.filter((d) => d.materijalId === materijal.id).length;
  const broj = (v: string) => Number(v) || 0;

  return (
    <div className="card">
      <div className="polja" style={{ marginBottom: 12 }}>
        <Polje oznaka={t('Naziv')}>
          <input
            value={materijal.naziv}
            onChange={(e) => izmeni(materijal.id, { naziv: e.target.value })}
          />
        </Polje>
        <Polje oznaka={`${t('Debljina')} (mm)`}>
          <input
            type="number"
            inputMode="decimal"
            value={materijal.debljina}
            onChange={(e) => izmeni(materijal.id, { debljina: broj(e.target.value) })}
          />
        </Polje>
      </div>

      <div className="polja" style={{ marginBottom: 12 }}>
        <Polje oznaka={`${t('Tabla')} — ${t('Dužina')}`}>
          <input
            type="number"
            inputMode="numeric"
            value={materijal.tablaL}
            onChange={(e) => izmeni(materijal.id, { tablaL: broj(e.target.value) })}
          />
        </Polje>
        <Polje oznaka={`${t('Tabla')} — ${t('Širina')}`}>
          <input
            type="number"
            inputMode="numeric"
            value={materijal.tablaW}
            onChange={(e) => izmeni(materijal.id, { tablaW: broj(e.target.value) })}
          />
        </Polje>
        <Polje oznaka={`${t('Rez')} (mm)`}>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={materijal.kerf}
            onChange={(e) => izmeni(materijal.id, { kerf: broj(e.target.value) })}
          />
        </Polje>
        <Polje oznaka={`${t('Obrez')} (mm)`}>
          <input
            type="number"
            inputMode="numeric"
            value={materijal.trim}
            onChange={(e) => izmeni(materijal.id, { trim: broj(e.target.value) })}
          />
        </Polje>
      </div>

      <Prekidac
        ukljucen={materijal.imaTeksturu}
        tekst={t('Ima teksturu')}
        onPromena={(v) => izmeni(materijal.id, { imaTeksturu: v })}
      />

      <div className="akcije">
        <button
          className="nv-btn nv-btn--ghost nv-btn--danger"
          disabled={uUpotrebi > 0}
          title={uUpotrebi > 0 ? `${t('Materijal se koristi u delovima')}: ${uUpotrebi}` : ''}
          style={uUpotrebi > 0 ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
          onClick={() => obrisi(materijal.id)}
        >
          {t('Obriši')}
        </button>
      </div>
    </div>
  );
}

export function MaterijaliScreen() {
  const materijali = useProjectStore((s) => s.projekat.materijali);
  const kantovi = useProjectStore((s) => s.projekat.kantovi);
  const dodaj = useProjectStore((s) => s.dodajMaterijal);
  const t = useT();

  return (
    <>
      <div className="sec-naslov" style={{ marginTop: 0 }}>
        <h2>{t('Materijali')}</h2>
        <span className="sec-naslov__crta" />
      </div>

      {materijali.map((m) => (
        <MaterijalKartica key={m.id} materijal={m} />
      ))}

      <button className="nv-btn nv-btn--primary" onClick={dodaj}>
        + {t('Novi materijal')}
      </button>

      <div className="sec-naslov">
        <h2>{t('Kantovanje')}</h2>
        <span className="sec-naslov__crta" />
      </div>

      <div className="card">
        {kantovi.map((k) => (
          <div key={k.id} className="red-stavka">
            <span>{k.naziv}</span>
            <span className="red-stavka__vrednost">{k.debljina} mm</span>
          </div>
        ))}
      </div>
    </>
  );
}
