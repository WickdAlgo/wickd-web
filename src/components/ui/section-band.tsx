export interface SectionBandProps {
  color?: string;
  height?: number;
}

/** Full-width chromatic divider band — section separation instead of whitespace. */
export function SectionBand({
  color = "var(--structure-bullish)",
  height = 12,
}: SectionBandProps) {
  return <div aria-hidden="true" className="w-full" style={{ height, background: color }} />;
}
