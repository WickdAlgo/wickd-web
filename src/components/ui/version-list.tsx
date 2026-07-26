import React from "react";
import { cx } from "@/lib/cx";

export interface BuildVersion {
  /** Short component name, e.g. "web", "core". */
  label: string;
  /** The build string exactly as it should render, e.g. "v0.1.0-preview". */
  version: string;
}

export interface VersionListProps
  extends React.HTMLAttributes<HTMLDListElement> {
  versions: BuildVersion[];
}

/**
 * Build markers as a two-column mono readout — labels in one track, numbers
 * aligned in the next. Deliberately not pills: these are metadata, not controls.
 *
 * Colour is inherited rather than baked in, because the surfaces differ — the
 * footer sits on the inverse background, page chrome on the canvas.
 */
export function VersionList({ versions, className, ...rest }: VersionListProps) {
  return (
    <dl
      className={cx(
        // auto tracks, not grid-cols-2: the label column should size to content
        // so the numbers line up in a single column.
        "grid w-fit grid-cols-[auto_auto] gap-x-2 whitespace-nowrap font-mono text-caption",
        className,
      )}
      {...rest}
    >
      {versions.map((v) => (
        <React.Fragment key={v.label}>
          <dt>{v.label}</dt>
          <dd>{v.version}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}
