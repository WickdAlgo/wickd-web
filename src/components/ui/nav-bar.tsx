"use client";
import React from "react";
import Link from "next/link";
import { cx } from "@/lib/cx";
import { container } from "@/lib/styles";
import { Button } from "./button";
import { AnimatedLogo } from "./animated-logo";

export interface NavLink {
  label: string;
  href: string;
}

export interface NavBarProps extends React.HTMLAttributes<HTMLElement> {
  links?: NavLink[];
  /** href of the link to highlight (usually the current pathname). */
  activeHref?: string;
  /** Pin to the viewport and reserve its height in the flow. */
  sticky?: boolean;
  loginHref?: string;
  signUpHref?: string;
}

/** Exact match for the root, prefix match elsewhere so nested routes stay lit. */
function isActive(href: string, activeHref?: string) {
  if (!activeHref) return false;
  if (href === "/") return activeHref === "/";
  return activeHref === href || activeHref.startsWith(`${href}/`);
}

/** Shared by the horizontal rail and the drawer — the rule rotates, the size steps up. */
const linkBase =
  "font-display font-medium whitespace-nowrap no-underline outline-none [transition:color_var(--transition-fast)] focus-visible:[box-shadow:var(--focus-ring)]";


const iconButton =
  "inline-flex h-9 w-9 flex-none cursor-pointer items-center justify-center rounded-icons border border-solid border-strong bg-card text-ink outline-none [transition:all_var(--transition-fast)] hover:bg-subtle focus-visible:[box-shadow:var(--focus-ring)]";

const brandLink =
  "wa-brand flex shrink-0 items-center gap-2.5 font-display text-subheading font-semibold text-ink no-underline outline-none focus-visible:[box-shadow:var(--focus-ring)]";

export function NavBar({
  links = [],
  activeHref,
  sticky = true,
  loginHref,
  signUpHref,
  className,
  ...rest
}: NavBarProps) {
  const [open, setOpen] = React.useState(false);
  const menuId = React.useId();
  const drawerRef = React.useRef<HTMLDivElement>(null);

  // A route change dismisses the drawer — adjusted during render rather than in an
  // effect, so back/forward navigation closes it without a cascading re-render.
  const [seenHref, setSeenHref] = React.useState(activeHref);
  if (seenHref !== activeHref) {
    setSeenHref(activeHref);
    setOpen(false);
  }

  // While the drawer is open the page behind it is inert: scroll is locked, focus
  // is trapped, Escape closes, and focus returns to whatever opened it.
  React.useEffect(() => {
    const drawer = drawerRef.current;
    if (!open || !drawer) return;
    const opener = document.activeElement as HTMLElement | null;
    drawer.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(
        drawer.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    // Measure the gutter the lock actually reclaims, so viewports with overlay
    // scrollbars (which reclaim nothing) are not padded and never shift.
    const prev = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    const widthBefore = document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    const gutter = document.documentElement.clientWidth - widthBefore;
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    // A tablet rotating past the lg breakpoint hides the drawer via CSS while the
    // lock and the trap stay live, leaving the page inert with nothing to dismiss.
    // Only the change event is needed: the toggle is lg:hidden, so the drawer can
    // never be opened at or above the breakpoint in the first place.
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onBreakpoint = () => {
      if (desktop.matches) setOpen(false);
    };

    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onBreakpoint);
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
      document.body.style.overflow = prev.overflow;
      document.body.style.paddingRight = prev.paddingRight;
      opener?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className={cx(
          // Promote the bar to its own compositor layer so a translucent fixed header
          // is not re-blurred per scroll frame (which reads as the bar drifting on
          // phones and tablets).
          "z-50 h-16 border-b border-hairline bg-(--surface-nav) backface-hidden backdrop-blur-sm will-change-transform",
          sticky ? "fixed inset-x-0 top-0" : "relative",
          className,
        )}
        {...rest}
      >
        <div className={cx(container, "flex h-full items-center gap-4")}>
          <Link href="/" className={brandLink}>
            {/* The mark is desktop-only; on mobile the wordmark stands alone. */}
            <span className="hidden lg:block">
              <AnimatedLogo size={28} />
            </span>
            WickdAlgo
          </Link>

          <div className="hidden h-full gap-1 lg:flex">
            {links.map((l) => {
              const active = isActive(l.href, activeHref);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "-mb-px inline-flex items-center border-b-2 border-solid px-3.5 text-body-sm",
                    linkBase,
                    active
                      ? "border-ink text-ink"
                      : "border-transparent text-ink-secondary hover:text-ink",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls={menuId}
            className={cx(iconButton, "ml-auto lg:hidden")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            >
              <path d="M2 4h12" />
              <path d="M2 8h12" />
              <path d="M2 12h12" />
            </svg>
          </button>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <Button variant="ghost" size="sm" href={loginHref}>
              Login
            </Button>
            <Button size="sm" href={signUpHref}>
              Sign up
            </Button>
          </div>
        </div>
      </nav>
      {/* Reserves the fixed bar's height so page content is never hidden behind it. */}
      {sticky && <div aria-hidden="true" className="h-16" />}

      {/* Kept outside <nav>: its backdrop-filter would become the containing block
          for these fixed layers and collapse them into the 64px bar. Equal z-index
          plus DOM order puts the scrim over the bar and the drawer over the scrim. */}
      {open && (
        <>
          <div
            aria-hidden="true"
            onClick={close}
            className="wa-scrim fixed inset-0 z-50 bg-(--overlay-scrim) lg:hidden"
          />
          <div
            id={menuId}
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${menuId}-title`}
            tabIndex={-1}
            className="wa-drawer fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85%] flex-col border-l border-hairline bg-(--surface-nav) outline-none backdrop-blur-sm lg:hidden"
          >
            <div className="flex h-16 flex-none items-center justify-between gap-4 border-b border-hairline px-5">
              {/* Deliberately not the wordmark: the bar's own brand stays visible
                  beside the drawer, and repeating it reads as two logos at once. */}
              <span
                id={`${menuId}-title`}
                className="font-mono text-caption uppercase text-ink"
              >
                Menu
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className={iconButton}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                >
                  <path d="M3.5 3.5 12.5 12.5" />
                  <path d="M12.5 3.5 3.5 12.5" />
                </svg>
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto py-4">
              {links.map((l) => {
                const active = isActive(l.href, activeHref);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={close}
                    className={cx(
                      // A step up the scale from the desktop rail: at drawer width these
                      // are the panel's primary content, not chrome squeezed into 64px.
                      // Full-strength ink on both states, because the frosted panel sits
                      // over an unpredictable backdrop where ink-secondary drops below
                      // AA. The left rule carries the active distinction instead.
                      "border-l-2 border-solid px-5 py-3 text-subheading text-ink",
                      linkBase,
                      active ? "border-ink" : "border-transparent",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex-none border-t border-hairline px-5 py-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  href={loginHref}
                  onClick={close}
                >
                  Login
                </Button>
                <Button size="sm" href={signUpHref} onClick={close}>
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
