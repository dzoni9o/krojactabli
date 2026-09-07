import type { Ivica, Kant, Kantovanje } from '../types/domain';
import { useT } from '../i18n';

/**
 * Ivice se biraju na crtežu ploče, ne u padajućoj listi — tako majstor
 * i razmišlja. Dugi rub gore/dole = L1/L2, kratki levo/desno = W1/W2.
 * Tap kruži kroz raspoložive kantove pa nazad na „bez kanta".
 */
export function KantIzbor({
  kant,
  kantovi,
  duzina,
  sirina,
  onPromena,
}: {
  kant: Kantovanje;
  kantovi: Kant[];
  duzina: number;
  sirina: number;
  onPromena: (k: Kantovanje) => void;
}) {
  const t = useT();

  const sledeci = (trenutni: string | null): string | null => {
    if (kantovi.length === 0) return null;
    if (trenutni === null) return kantovi[0].id;
    const i = kantovi.findIndex((k) => k.id === trenutni);
    return i === -1 || i === kantovi.length - 1 ? null : kantovi[i + 1].id;
  };

  const prebaci = (ivica: Ivica) => onPromena({ ...kant, [ivica]: sledeci(kant[ivica]) });

  const sveIste = (id: string | null) =>
    onPromena({ L1: id, L2: id, W1: id, W2: id });

  const oznaka = (ivica: Ivica) => {
    const id = kant[ivica];
    if (!id) return '—';
    const k = kantovi.find((x) => x.id === id);
    return k ? String(k.debljina) : '—';
  };

  const klasa = (ivica: Ivica) =>
    `kant__ivica${kant[ivica] ? ' kant__ivica--on' : ''}`;

  return (
    <div>
      <span className="nv-label">{t('Kantovanje')}</span>
      <div className="kant">
        <div className="kant__ugao" />
        <button type="button" className={klasa('L1')} onClick={() => prebaci('L1')}>
          {oznaka('L1')}
        </button>
        <div className="kant__ugao" />

        <button type="button" className={klasa('W1')} onClick={() => prebaci('W1')}>
          {oznaka('W1')}
        </button>
        <div className="kant__ploca">
          <span>{duzina || '—'} × {sirina || '—'}</span>
          <span style={{ fontSize: 10, color: 'var(--nv-text-faint)' }}>mm</span>
        </div>
        <button type="button" className={klasa('W2')} onClick={() => prebaci('W2')}>
          {oznaka('W2')}
        </button>

        <div className="kant__ugao" />
        <button type="button" className={klasa('L2')} onClick={() => prebaci('L2')}>
          {oznaka('L2')}
        </button>
        <div className="kant__ugao" />
      </div>
      <p className="kant__uput">{t('Mera koju uneseš je i mera reza.')}</p>
      <div className="akcije" style={{ marginTop: 0 }}>
        {kantovi.map((k) => (
          <button
            key={k.id}
            type="button"
            className="nv-btn nv-btn--ghost"
            onClick={() => sveIste(k.id)}
          >
            4 × {k.debljina}
          </button>
        ))}
        <button type="button" className="nv-btn nv-btn--ghost" onClick={() => sveIste(null)}>
          0
        </button>
      </div>
    </div>
  );
}
