import Link from "next/link";

export type Crumb = { label: string; href?: string };

/**
 * Visible trail only. The machine-readable `BreadcrumbList` is emitted by
 * each page next to its own JSON-LD, because the schema needs absolute URLs
 * and this component is deliberately kept to relative hrefs.
 *
 * The current page is a plain <span> with `aria-current`, not a link — a
 * link to the page you are already on is noise for keyboard and screen
 * reader users alike.
 */
export default function Breadcrumbs({ items, label }: { items: Crumb[]; label: string }) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-600">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-accent-700">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="text-ink-800">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span aria-hidden="true" className="text-ivory-600">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
