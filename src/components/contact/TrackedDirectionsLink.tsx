"use client";

import type { AnchorHTMLAttributes, MouseEvent } from "react";

import { trackDirectionsClick } from "@/lib/analytics";

export default function TrackedDirectionsLink({
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) trackDirectionsClick();
  };

  return <a onClick={handleClick} {...props} />;
}
