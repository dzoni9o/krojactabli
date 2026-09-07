import { useT } from '../i18n';
import { useUiStore, type Ekran } from '../store/useUiStore';

const STAVKE: { id: Ekran; ikona: string; naziv: string }[] = [
  { id: 'delovi', ikona: '▤', naziv: 'Delovi' },
  { id: 'raspored', ikona: '▦', naziv: 'Raspored' },
  { id: 'sklop', ikona: '◫', naziv: 'Sklop' },
  { id: 'materijali', ikona: '☰', naziv: 'Materijali' },
];

export function TabBar() {
  const t = useT();
  const ekran = useUiStore((s) => s.ekran);
  const postaviEkran = useUiStore((s) => s.postaviEkran);

  return (
    <nav className="tabs">
      {STAVKE.map((s) => (
        <button
          key={s.id}
          className={`tab${ekran === s.id ? ' tab--on' : ''}`}
          onClick={() => postaviEkran(s.id)}
          aria-current={ekran === s.id}
        >
          <span className="tab__ikona">{s.ikona}</span>
          {t(s.naziv)}
        </button>
      ))}
    </nav>
  );
}
