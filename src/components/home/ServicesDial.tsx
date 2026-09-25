"use client";

import { useCallback, useState, type FocusEvent, type PointerEvent, type ReactNode } from "react";

import ServiceIcon from "@/components/ui/ServiceIcons";

export type DialItem = { slug: string; blurb: string };

/**
 * The services index and the dial that answers it.
 *
 * This replaces the photograph that used to fade in behind a hovered row.
 * Those files are line illustrations drawn on white for ~200px display;
 * stretched across 42% of a row they came out as a soft, cropped white slab
 * on an ivory page — the one thing in the section that looked unfinished.
 *
 * The dial borrows its language from two places the brand already owns:
 * the loose concentric strokes of the logo, and the orbit-and-node drawing
 * style of the service illustrations. Five nodes sit on the ring, one per
 * direction, each carrying that direction's icon. Pointing at a row turns
 * the dial until its node reaches the index mark at the top, and the centre
 * answers with the direction's one-line promise — the one piece of copy the
 * row itself does not show.
 *
 * Mechanics, and why they are the way they are:
 *
 * - The list stays server-rendered and arrives here as `children`. This
 *   island only listens: one delegated pointer/focus handler on the wrapper
 *   reads `data-dial-index` off whichever row the event came from. Nothing
 *   in the list re-renders when the dial turns.
 * - The dial keeps the *last* row pointed at rather than snapping back when
 *   the pointer leaves the list. A dial that spins home every time the
 *   mouse drifts toward the "all services" link is noise.
 * - It always takes the short way round. Rotation is accumulated in whole
 *   steps, so going from the fifth node to the first is one step clockwise,
 *   not four the other way.
 * - Everything that moves is a CSS transform on an HTML box — the ring, the
 *   counter-rotation that keeps each icon upright, the idle drift of the
 *   dotted orbit — so all of it runs on the compositor.
 * - Desktop only (the column is `hidden` below lg). There is no hover to
 *   answer on a phone, and the rows carry their icons themselves there.
 */
export default function ServicesDial({
  items,
  total,
  totalLabel,
  children,
}: {
  items: DialItem[];
  total: number;
  totalLabel: string;
  children: ReactNode;
}) {
  const n = items.length;
  const step = n > 0 ? 360 / n : 0;
  const [state, setState] = useState<{ active: number | null; turn: number }>({
    active: null,
    turn: 0,
  });

  const select = useCallback(
    (next: number) =>
      setState((current) => {
        if (current.active === next || next < 0 || next >= n) return current;
        const from = current.active ?? 0;
        let delta = (((next - from) % n) + n) % n;
        if (delta > n / 2) delta -= n;
        return { active: next, turn: current.turn - delta };
      }),
    [n],
  );

  const fromEvent = (event: PointerEvent<HTMLDivElement> | FocusEvent<HTMLDivElement>) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>("[data-dial-index]");
    if (row) select(Number(row.dataset.dialIndex));
  };

  const rotation = state.turn * step;

  return (
    <div
      className="flex min-h-0 flex-col lg:grid lg:flex-1 lg:grid-cols-12 lg:gap-10 xl:gap-16"
      onPointerOver={fromEvent}
      onFocus={fromEvent}
    >
      <div className="flex min-h-0 flex-col lg:col-span-7">{children}</div>

      {/* A size container, so the dial can be `min(width, height)` of the
          space the list leaves it — the section is exactly one screen from
          lg and the dial has to shrink with a short laptop window rather
          than push the rows. */}
      <div
        className="dial-well relative hidden min-h-0 items-center justify-center lg:col-span-5 lg:flex"
        aria-hidden="true"
      >
        <div className="dial relative aspect-square">
          {/* Dotted orbit, drifting. */}
          <div className="dial-orbit absolute inset-0">
            <svg viewBox="0 0 100 100" className="h-full w-full overflow-visible">
              <circle
                cx="50"
                cy="50"
                r="49.2"
                fill="none"
                stroke="var(--color-accent-400)"
                strokeWidth="0.45"
                strokeLinecap="round"
                strokeDasharray="0.01 1.9"
                opacity="0.7"
              />
            </svg>
          </div>

          {/* The disc the answer sits on. */}
          <div
            className="absolute inset-[16%] rounded-full"
            style={{
              background:
                "radial-gradient(circle at 36% 28%, var(--color-ivory-50) 0%, var(--color-accent-50) 46%, color-mix(in oklab, var(--color-accent-100) 85%, var(--color-accent-200)) 100%)",
              boxShadow:
                "0 40px 90px -46px rgb(31 114 162 / 0.55), inset 0 0 0 1px color-mix(in oklab, var(--color-accent-300) 40%, transparent)",
            }}
          />

          {/* Loose strokes, after the logo — three rings that never quite
              agree, which is what keeps the drawing from looking like a UI
              spinner. */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
            <g fill="none" stroke="var(--color-accent-300)" strokeLinecap="round">
              <ellipse cx="50" cy="50" rx="42.4" ry="41.2" transform="rotate(-12 50 50)" strokeWidth="0.35" />
              <ellipse cx="50.4" cy="49.6" rx="41.6" ry="42.6" transform="rotate(21 50 50)" strokeWidth="0.25" opacity="0.8" />
              <path d="M 22 20 A 40 40 0 0 1 86 32" strokeWidth="0.5" opacity="0.9" />
            </g>
            {/* Crosshair ticks, from the diagnostics drawing. */}
            <g stroke="var(--color-accent-400)" strokeWidth="0.35" strokeLinecap="round" opacity="0.8">
              <path d="M50 16.8v2.6M50 80.6v2.6M16.8 50h2.6M80.6 50h2.6" />
            </g>
          </svg>

          {/* Index mark — where the chosen node comes to rest. It sits
              just outside the orbit, so the node never covers it. */}
          <span className="absolute left-1/2 top-[-4.5%] flex -translate-x-1/2 flex-col items-center">
            <span className="h-[1.6cqw] w-[1.6cqw] rounded-full bg-accent-500" />
            <span className="h-[3cqw] w-px bg-gradient-to-b from-accent-500 to-transparent" />
          </span>

          {/* The turning ring. */}
          <div
            className="absolute inset-0 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            {items.map((item, index) => {
              const angle = (index * step * Math.PI) / 180;
              const radius = 42;
              const isActive = state.active === index;

              return (
                <div
                  key={item.slug}
                  className="absolute h-[13%] w-[13%] -translate-x-1/2 -translate-y-1/2"
                  style={{
                    /* Fixed precision: the server and the browser
                       serialise long floats differently, and a
                       mismatch in the last digit is a hydration error. */
                    left: `${(50 + radius * Math.sin(angle)).toFixed(2)}%`,
                    top: `${(50 - radius * Math.cos(angle)).toFixed(2)}%`,
                  }}
                >
                  <div
                    className="h-full w-full transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ transform: `rotate(${-rotation}deg)` }}
                  >
                    <div
                      className={`flex h-full w-full items-center justify-center rounded-full ring-1 transition-[background-color,color,transform,box-shadow] duration-500 ${
                        isActive
                          ? "scale-110 bg-accent-300 text-brand-900 shadow-glow ring-accent-400"
                          : "bg-ivory-50 text-accent-600 ring-accent-200"
                      }`}
                    >
                      <ServiceIcon name={item.slug} className="dial-icon h-[48%] w-[48%]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* The answer. Every panel is rendered and stacked in one grid
              cell; the active one fades up. */}
          <div className="absolute inset-[25%] grid place-items-center text-center">
            <div
              data-active={state.active === null}
              className="dial-panel col-start-1 row-start-1 flex flex-col items-center"
            >
              <span className="font-display text-[clamp(3rem,15cqw,5.5rem)] leading-none text-brand-800">
                {total}
              </span>
              <span className="mt-[4cqw] max-w-[30cqw] text-[clamp(0.75rem,2.6cqw,0.9rem)] leading-snug text-ink-600">
                {totalLabel}
              </span>
            </div>

            {items.map((item, index) => (
              <div
                key={item.slug}
                data-active={state.active === index}
                className="dial-panel col-start-1 row-start-1 flex flex-col items-center"
              >
                <span className="font-display text-[clamp(0.75rem,2.5cqw,0.9rem)] tabular-nums tracking-[0.12em] text-accent-600">
                  {String(index + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
                </span>
                <ServiceIcon
                  name={item.slug}
                  className="dial-icon mt-[3cqw] h-[14cqw] w-[14cqw] text-brand-800"
                />
                <p className="mt-[3.5cqw] text-[clamp(0.78rem,2.7cqw,0.95rem)] leading-relaxed text-ink-700">
                  {item.blurb}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
