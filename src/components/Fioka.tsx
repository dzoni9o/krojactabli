import { useEffect, type ReactNode } from 'react';

/** Donja fioka — na telefonu izlazi odozdo, na desktopu je centrirani dijalog. */
export function Fioka({
  naslov,
  onZatvori,
  children,
  podnozje,
}: {
  naslov: string;
  onZatvori: () => void;
  children: ReactNode;
  podnozje?: ReactNode;
}) {
  useEffect(() => {
    const naEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onZatvori();
    };
    window.addEventListener('keydown', naEsc);
    return () => window.removeEventListener('keydown', naEsc);
  }, [onZatvori]);

  return (
    <>
      <div className="fioka__zastor" onClick={onZatvori} />
      <div className="fioka" role="dialog" aria-modal="true" aria-label={naslov}>
        <div className="fioka__rucka" />
        <div className="fioka__glava">
          <h2>{naslov}</h2>
          <button className="nv-btn nv-btn--ghost" onClick={onZatvori} aria-label="Zatvori">
            ✕
          </button>
        </div>
        {children}
        {podnozje && <div className="fioka__podnozje">{podnozje}</div>}
      </div>
    </>
  );
}
