import './styles/global.css';
import './styles/app.css';
import { useT } from './i18n';
import { useUiStore } from './store/useUiStore';
import { TabBar } from './components/TabBar';
import { DeloviScreen } from './screens/DeloviScreen';
import { MaterijaliScreen } from './screens/MaterijaliScreen';
import { UskoroScreen } from './screens/UskoroScreen';
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
        {ekran === 'raspored' && (
          <UskoroScreen
            faza="F2"
            naslov="Raspored"
            opis="Raspored delova po tablama, guillotine rez."
          />
        )}
        {ekran === 'sklop' && (
          <UskoroScreen faza="F4" naslov="Sklop" opis="Sklapanje korpusa u 3D prostoru." />
        )}
        {ekran === 'materijali' && <MaterijaliScreen />}
      </main>

      <TabBar />

      {deoUIzmeni && <DeoIzmena key={deoUIzmeni} deoId={deoUIzmeni} />}

      <span hidden>{t('Krojač tabli')}</span>
    </div>
  );
}
