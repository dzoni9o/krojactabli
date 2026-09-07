import type { ReactNode } from 'react';

export function Polje({ oznaka, children }: { oznaka: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block' }}>
      <span className="nv-label">{oznaka}</span>
      {children}
    </label>
  );
}
