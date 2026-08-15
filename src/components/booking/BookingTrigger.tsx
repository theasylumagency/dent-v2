"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";

import { useBooking } from "./BookingProvider";

export default function BookingTrigger({
  children,
  onClick,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { openBooking } = useBooking();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) openBooking(event.currentTarget);
  };

  return (
    <button type={type} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
