type IconProps = { className?: string };

export function ArrowUpRight({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.5 11.5L11.5 4.5M11.5 4.5H6M11.5 4.5V10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDown({ className = "h-3.5 w-3.5" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 6.5L8 10.5L12 6.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Globe({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.1" />
      <ellipse cx="8" cy="8" rx="2.6" ry="6" stroke="currentColor" strokeWidth="1.1" />
      <path d="M2.3 6.2h11.4M2.3 9.8h11.4" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function Phone({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M5.2 2.7 6.6 5 5.3 6.5c.6 1.4 1.8 2.6 3.2 3.2L10 8.4l2.3 1.4-.6 2.2c-.2.5-.7.8-1.2.7A9.6 9.6 0 0 1 2.7 4.5c-.1-.5.2-1 .7-1.2l1.8-.6Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Clock({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.1" />
      <path d="M8 4.7V8l2.2 1.7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function Pin({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 14s4.5-4 4.5-7.4A4.5 4.5 0 0 0 8 2a4.5 4.5 0 0 0-4.5 4.6C3.5 10 8 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.6" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function Sparkle({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 1.5c.4 3.3 2.7 5.6 6 6-3.3.4-5.6 2.7-6 6-.4-3.3-2.7-5.6-6-6 3.3-.4 5.6-2.7 6-6Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Pause({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <rect x="4.5" y="3.5" width="2.4" height="9" rx="0.8" />
      <rect x="9.1" y="3.5" width="2.4" height="9" rx="0.8" />
    </svg>
  );
}

export function Play({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M5.4 3.6a.8.8 0 0 1 1.22-.68l5.3 3.3a.8.8 0 0 1 0 1.36l-5.3 3.3A.8.8 0 0 1 5.4 10.2V3.6Z" />
    </svg>
  );
}

export function WhatsApp({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24a8.2 8.2 0 0 1 8.24 8.25c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.8-.23-.09-.39-.13-.56.12s-.64.8-.79.97c-.14.17-.29.19-.54.06-.25-.12-1.05-.38-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.09-.16.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05s.88 2.38 1 2.54c.13.17 1.74 2.65 4.2 3.72.59.25 1.05.4 1.4.52.6.19 1.14.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.15-1.19-.06-.1-.23-.17-.48-.29Z" />
    </svg>
  );
}

export function Mail({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="9" rx="1.6" stroke="currentColor" strokeWidth="1.1" />
      <path d="m2.6 4.6 4.7 3.3c.42.3.98.3 1.4 0l4.7-3.3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export function Menu({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M3 6.5h14M3 13.5h9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function Close({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
