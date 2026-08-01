import { Tag } from "@/components/ui";

export interface PlatformHeaderProps {
  title: string;
  blurb: string;
  /** Rendered to the right of the title — run badges, mode switches. */
  actions?: React.ReactNode;
}

/**
 * The heading for one platform route. A server component: it renders text.
 */
export function PlatformHeader({ title, blurb, actions }: PlatformHeaderProps) {
  return (
    <div className="mb-4.5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
      <h1 className="font-display m-0 text-[24px] font-semibold tracking-[0.6px]">
        {title}
      </h1>
      <span className="font-ui text-[12px] tracking-[0.3px] text-ink-secondary">
        {blurb}
      </span>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/**
 * The illustration notice — `WEB-BL-004`.
 *
 * `PRODUCT.md` requires that generated content read as illustration, and this
 * surface now renders a trade journal with mentor signals, execution fills, and
 * an R figure. That looks far more like a running product than generated
 * candles did, which is exactly why the label sits in the shared layout rather
 * than in whichever views someone remembered to add it to.
 *
 * It stays on one line at mobile width by dropping the sentence, not the Tag.
 */
export function DemonstrationNotice() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-cards border border-hairline bg-subtle px-3.5 py-2.5">
      <Tag mono>demonstration</Tag>
      <span className="font-ui text-[12px] leading-[1.5] tracking-[0.3px] text-ink-secondary">
        <span className="hidden sm:inline">
          Every chart, structure, and trade below is generated from a fixed seed.
          Nothing is fetched, no market is being analysed, and no account exists.{" "}
        </span>
        <span className="sm:hidden">Generated sample data — nothing here is live.</span>
      </span>
    </div>
  );
}
