"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger in milliseconds. */
  delay?: number;
  className?: string;
  as?: ElementType;
};

/**
 * Fades content in as it scrolls into view.
 *
 * Deliberately drives the class through the DOM rather than React state: the
 * reveal is a visual side effect with no bearing on the rendered tree, and
 * setting state from the observer would re-render every wrapped section.
 * It also keeps the server and client markup identical — with state, the
 * no-IntersectionObserver fallback would disagree across hydration.
 */
export default function Reveal({ children, delay = 0, className = "", as }: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const show = () => node.classList.add("is-visible");

    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    /* threshold 0 with a small bottom margin: the previous 8% threshold
       meant a tall block (the stats card, the technology list) had to be
       most of the way up the screen before it would fade in, which read
       as the page lagging behind the scroll. */
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
