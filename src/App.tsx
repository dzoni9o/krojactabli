import { lazy, Suspense } from 'react';
import './styles/global.css';
import './styles/app.css';
import { useT } from './i18n';
import { useUiStore } from './store/useUiStore';
import { TabBar } from './components/TabBar';
import { OznakaVeze } from './components/OznakaVeze';
import { JavkaVerzije } from './components/JavkaVerzije';
import { DeloviScreen } from './screens/DeloviScreen';
import { MaterijaliScreen } from './screens/MaterijaliScreen';
import { RasporedScreen } from './screens/RasporedScreen';

// three.js je krupan — učitava se tek kad se otvori prostor.
const ProstorScreen = lazy(() =>
  import('./screens/ProstorScreen').then((m) => ({ default: m.ProstorScreen })),
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
        <OznakaVeze />
        <button
          className="app__lang"
          onClick={() => postaviJezik(jezik === 'sr' ? 'en' : 'sr')}
          aria-label="Jezik / Language"
        >
          {jezik.toUpperCase()}
        </button>
      </header>

      <main className="app__body">
        {ekran === 'prostor' && (
          <Suspense
            fallback={
              <div className="traka">
                <div className="traka__punjenje" style={{ width: '40%' }} />
              </div>
            }
          >
            <ProstorScreen />
          </Suspense>
        )}
        {ekran === 'delovi' && <DeloviScreen />}
        {ekran === 'raspored' && <RasporedScreen />}
        {ekran === 'materijali' && <MaterijaliScreen />}
      </main>

      <TabBar />
      <JavkaVerzije />

      {deoUIzmeni && <DeoIzmena key={deoUIzmeni} deoId={deoUIzmeni} />}

      <span hidden>{t('Krojač tabli')}</span>
    </div>
  );
}
