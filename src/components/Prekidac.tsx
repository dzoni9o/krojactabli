export function Prekidac({
  ukljucen,
  tekst,
  opis,
  onPromena,
}: {
  ukljucen: boolean;
  tekst: string;
  opis?: string;
  onPromena: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ukljucen}
      className={`prekidac${ukljucen ? ' prekidac--on' : ''}`}
      onClick={() => onPromena(!ukljucen)}
    >
      <span className="prekidac__kutija" />
      <span>
        <span className="prekidac__tekst">{tekst}</span>
        {opis && (
          <>
            <br />
            <span className="prekidac__opis">{opis}</span>
          </>
        )}
      </span>
    </button>
  );
}
