/**
 * Unos mere sa dugmadima ± . Na telefonu je kucanje u brojčano polje sporo,
 * a mere se ionako menjaju u koracima od centimetra.
 */
export function MeraUnos({
  oznaka,
  vrednost,
  korak = 10,
  min = 0,
  max = 100000,
  onPromena,
}: {
  oznaka: string;
  vrednost: number;
  korak?: number;
  min?: number;
  max?: number;
  onPromena: (v: number) => void;
}) {
  const stegni = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <div>
      <span className="nv-label">{oznaka}</span>
      <div className="mera">
        <button type="button" onClick={() => onPromena(stegni(vrednost - korak))} aria-label="−">
          −
        </button>
        <input
          type="number"
          inputMode="numeric"
          value={vrednost}
          onChange={(e) => onPromena(stegni(Number(e.target.value) || 0))}
          aria-label={oznaka}
        />
        <button type="button" onClick={() => onPromena(stegni(vrednost + korak))} aria-label="+">
          +
        </button>
      </div>
    </div>
  );
}
