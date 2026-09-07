import { useT } from '../i18n';

export function UskoroScreen({
  faza,
  naslov,
  opis,
}: {
  faza: string;
  naslov: string;
  opis: string;
}) {
  const t = useT();
  return (
    <div className="uskoro">
      <span className="uskoro__oznaka">
        {t('Uskoro — faza')} {faza}
      </span>
      <h2>{t(naslov)}</h2>
      <p>{t(opis)}</p>
    </div>
  );
}
