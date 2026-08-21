"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import { trackLandingCta, type LandingAnalyticsContext } from "@/lib/analytics";

export default function LandingCtaLink({
  children,
  context,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  context: LandingAnalyticsContext;
}) {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) trackLandingCta(context);
      }}
    >
      {children}
    </a>
  );
}
