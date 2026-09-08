import type { Postavka, Tabla, TablaPlan } from '../lib/nesting/tipovi';

/** Ispod ovih mera natpis se ne vidi — bolje prazan komad nego mrlja. */
const MIN_ZA_MERE = { w: 260, h: 190 };
const MIN_ZA_BROJ = { w: 120, h: 95 };

function Natpis({ p }: { p: Postavka }) {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const uspravno = p.h > p.w * 1.5;
  const transform = uspravno ? `rotate(-90 ${cx} ${cy})` : undefined;

  if (p.w < MIN_ZA_BROJ.w || p.h < MIN_ZA_BROJ.h) return null;

  const meredovoljno = p.w >= MIN_ZA_MERE.w && p.h >= MIN_ZA_MERE.h;

  return (
    <g transform={transform} textAnchor="middle">
      <text
        x={cx}
        y={meredovoljno ? cy - 6 : cy + 30}
        fontSize={88}
        fontWeight="700"
        fill="#0a0a0a"
      >
        {p.redni}
      </text>
      {meredovoljno && (
        <text x={cx} y={cy + 62} fontSize={52} fill="rgba(10,10,10,0.72)">
          {Math.round(p.rotiran ? p.h : p.w)}×{Math.round(p.rotiran ? p.w : p.h)}
          {p.rotiran ? ' ↻' : ''}
        </text>
      )}
    </g>
  );
}

export function TablaSvg({
  plan,
  tabla,
  boja,
}: {
  plan: TablaPlan;
  tabla: Tabla;
  boja: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${tabla.duzina} ${tabla.sirina}`}
      style={{ width: '100%', display: 'block', borderRadius: 4 }}
      role="img"
      aria-label={`Tabla ${plan.redni}`}
    >
      <rect width={tabla.duzina} height={tabla.sirina} fill="#141414" />

      {/* obrez ivica — ono što otpada pre rezanja */}
      <rect
        x={tabla.trim}
        y={tabla.trim}
        width={tabla.duzina - 2 * tabla.trim}
        height={tabla.sirina - 2 * tabla.trim}
        fill="none"
        stroke="#3a3a3a"
        strokeWidth={4}
        strokeDasharray="24 18"
      />

      {plan.ostaci.map((o, i) => (
        <g key={`ostatak-${i}`}>
          <rect
            x={o.x}
            y={o.y}
            width={o.w}
            height={o.h}
            fill="rgba(94,224,138,0.06)"
            stroke="rgba(94,224,138,0.5)"
            strokeWidth={3}
            strokeDasharray="18 14"
          />
          {o.w > 320 && o.h > 150 && (
            <text
              x={o.x + o.w / 2}
              y={o.y + o.h / 2 + 18}
              fontSize={50}
              textAnchor="middle"
              fill="rgba(94,224,138,0.75)"
            >
              ostatak {Math.round(o.w)}×{Math.round(o.h)}
            </text>
          )}
        </g>
      ))}

      {plan.postavke.map((p) => (
        <g key={`${p.deoId}-${p.redni}`}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} fill={boja} opacity={0.92} />
          <rect
            x={p.x}
            y={p.y}
            width={p.w}
            height={p.h}
            fill="none"
            stroke="#0a0a0a"
            strokeWidth={5}
          />
          <Natpis p={p} />
        </g>
      ))}
    </svg>
  );
}
