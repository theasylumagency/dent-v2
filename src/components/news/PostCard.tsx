import Image from "next/image";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
/* From `news-shared`, not `news` — this renders inside a client component,
   and importing the CMS-backed module would pull the Payload SDK into the
   browser bundle. */
import { formatPostDate, type Post } from "@/lib/news-shared";
import Reveal from "@/components/ui/Reveal";

export default function PostCard({
  post,
  lang,
  categoryLabel,
  delay = 0,
  priority = false,
}: {
  post: Post;
  lang: Locale;
  categoryLabel: string;
  delay?: number;
  priority?: boolean;
}) {
  return (
    <Reveal delay={delay} className="h-full">
      <article className="group card relative flex h-full flex-col overflow-hidden transition-[border-color,box-shadow] duration-300 hover:border-accent-400 hover:shadow-lift">
        <div className="relative aspect-[16/10] overflow-hidden bg-ivory-300">
          <Image
            src={post.cover}
            alt={post.coverAlt}
            fill
            sizes="(min-width: 1024px) 32vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="label-micro text-accent-700">{categoryLabel}</span>
            <span aria-hidden="true" className="text-ivory-600">
              ·
            </span>
            {/* `dateTime` carries the machine-readable value so the visible
                text can be localised without losing the real date. */}
            <time dateTime={post.publishedAt} className="text-xs text-ink-600">
              {formatPostDate(post.publishedAt, lang)}
            </time>
          </div>

          <h3 className="mt-4 font-display text-xl leading-snug">
            <Link href={post.href} className="transition-colors hover:text-accent-700">
              {/* Stretched link — the whole card is the target. */}
              <span className="after:absolute after:inset-0 after:content-['']">{post.title}</span>
            </Link>
          </h3>

          <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-700">{post.excerpt}</p>
        </div>
      </article>
    </Reveal>
  );
}
