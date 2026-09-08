import { lazy, Suspense } from 'react';
import './styles/global.css';
import './styles/app.css';
import { useT } from './i18n';
import { useUiStore } from './store/useUiStore';
import { TabBar } from './components/TabBar';
import { DeloviScreen } from './screens/DeloviScreen';
import { MaterijaliScreen } from './screens/MaterijaliScreen';
import { RasporedScreen } from './screens/RasporedScreen';

// three.js je krupan — ucitava se tek kad se otvori 3D sklop.
const SklopScreen = lazy(() =>
  import('./screens/SklopScreen').then((m) => ({ default: m.SklopScreen })),
);
import { DeoIzmena } from './screens/DeoIzmena';

export default function App() {
  const t = useT();
  const ekran = useUiStore((s) => s.ekran);
  const jezik = useUiStore((s) => s.jezik);
  const postaviJezik = useUiStore((s) => s.postaviJezik);
  const deoUIzmeni = useUiStore((s) => s.deoUIzmeni);

  return (
    <div className="app">
      <header className="app__head">
        <span className="app__mark">
          KROJAČ<span>·</span>TABLI
        </span>
        <span className="app__spacer" />
        <button
          className="app__lang"
          onClick={() => postaviJezik(jezik === 'sr' ? 'en' : 'sr')}
          aria-label="Jezik / Language"
        >
          {jezik.toUpperCase()}
        </button>
      </header>

      <main className="app__body">
        {ekran === 'delovi' && <DeloviScreen />}
        {ekran === 'raspored' && <RasporedScreen />}
        {ekran === 'sklop' && (
          <Suspense fallback={<div className="traka"><div className="traka__punjenje" style={{ width: '40%' }} /></div>}>
            <SklopScreen />
          </Suspense>
        )}
        {ekran === 'materijali' && <MaterijaliScreen />}
      </main>

      <TabBar />

      {deoUIzmeni && <DeoIzmena key={deoUIzmeni} deoId={deoUIzmeni} />}

      <span hidden>{t('Krojač tabli')}</span>
    </div>
  );
}
