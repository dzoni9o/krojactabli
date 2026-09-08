import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useT } from '../i18n';

/**
 * Nova verzija se ne uvodi sama — na gradilištu se aplikacija ne sme
 * zameniti usred posla. Javi se, pa majstor odluči kad će da osveži.
 *
 * Mora da stoji u korenu aplikacije, NE u zaglavlju: `.app__head` ima
 * `backdrop-filter`, a to pravi containing block za `position: fixed`
 * decu — javka bi završila iznad ekrana.
 */
export function JavkaVerzije() {
  const t = useT();
  const [spremnoVideno, postaviSpremnoVideno] = useState(false);

  const {
    needRefresh: [trebaOsvezavanje, postaviTrebaOsvezavanje],
    offlineReady: [spremnoBezMreze, postaviSpremnoBezMreze],
    updateServiceWorker,
  } = useRegisterSW();

  // Poruka „spremno bez mreže" se vidi jednom, pa se skloni sama.
  useEffect(() => {
    if (!spremnoBezMreze || spremnoVideno) return;
    postaviSpremnoVideno(true);
    const tajmer = setTimeout(() => postaviSpremnoBezMreze(false), 4000);
    return () => clearTimeout(tajmer);
  }, [spremnoBezMreze, spremnoVideno, postaviSpremnoBezMreze]);

  if (trebaOsvezavanje) {
    return (
      <div className="javka">
        <span>{t('Nova verzija je spremna')}</span>
        <button className="nv-btn nv-btn--primary" onClick={() => updateServiceWorker(true)}>
          {t('Osveži')}
        </button>
        <button
          className="nv-btn nv-btn--ghost"
          onClick={() => postaviTrebaOsvezavanje(false)}
          aria-label={t('Kasnije')}
        >
          ✕
        </button>
      </div>
    );
  }

  if (spremnoBezMreze) {
    return (
      <div className="javka javka--tiha">
        <span>{t('Spremno za rad bez mreže')}</span>
      </div>
    );
  }

  return null;
}
