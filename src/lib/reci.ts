/** Srpska množina: 1 deo, 2–4 dela, 5+ delova (uz izuzetke 11–14). */
export function mnozinaSr(n: number, oblici: [string, string, string]): string {
  const jedinica = Math.abs(n) % 10;
  const desetica = Math.abs(n) % 100;
  if (jedinica === 1 && desetica !== 11) return oblici[0];
  if (jedinica >= 2 && jedinica <= 4 && (desetica < 12 || desetica > 14)) return oblici[1];
  return oblici[2];
}
