import { useEffect, useState } from 'react';
import { useT } from '../i18n';

/** Stanje veze u zaglavlju — na gradilištu je korisno znati da radiš iz keša. */
export function OznakaVeze() {
  const t = useT();
  const [naMrezi, postaviNaMrezi] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const gore = () => postaviNaMrezi(true);
    const dole = () => postaviNaMrezi(false);
    window.addEventListener('online', gore);
    window.addEventListener('offline', dole);
    return () => {
      window.removeEventListener('online', gore);
      window.removeEventListener('offline', dole);
    };
  }, []);

  if (naMrezi) return null;

  return (
    <span className="veza veza--dole" title={t('Bez mreže — radi lokalno')}>
      {t('BEZ MREŽE')}
    </span>
  );
}
