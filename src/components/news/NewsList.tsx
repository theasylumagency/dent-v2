"use client";

import { useState } from "react";

import type { Locale } from "@/i18n/config";
import type { Post, PostCategory } from "@/lib/news-shared";
import PostCard from "./PostCard";

type Labels = {
  filterLabel: string;
  all: string;
  categories: Record<PostCategory, string>;
  empty: string;
};

/**
 * The list, with a client-side category filter.
 *
 * Filtering happens in the browser rather than through a `?category=`
 * search param on purpose: the param would make the route dynamic and cost
 * the static prerender for the sake of a two-button filter. Every post is
 * in the markup either way, so crawlers see the full list regardless of
 * which tab is selected.
 *
 * With four posts this is obviously enough. Once the CMS is feeding real
 * volume, this is the component to revisit — at that point pagination and
 * a real route per category start earning their keep.
 */
export default function NewsList({
  posts,
  lang,
  categories,
  labels,
}: {
  posts: Post[];
  lang: Locale;
  categories: PostCategory[];
  labels: Labels;
}) {
  const [active, setActive] = useState<PostCategory | "all">("all");
  const visible = active === "all" ? posts : posts.filter((post) => post.category === active);

  const tabs: { key: PostCategory | "all"; label: string }[] = [
    { key: "all", label: labels.all },
    ...categories.map((category) => ({ key: category, label: labels.categories[category] })),
  ];

  return (
    <>
      <div
        role="group"
        aria-label={labels.filterLabel}
        className="flex flex-wrap gap-2 border-t border-ivory-400 pt-8"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              aria-pressed={isActive}
              className={`inline-flex rounded-full border px-4 py-2 text-xs transition-colors ${
                isActive
                  ? "border-accent-500 bg-accent-50 font-medium text-accent-700"
                  : "border-ivory-600 bg-ivory-50 text-ink-700 hover:border-accent-500 hover:text-accent-700"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-14 text-base leading-relaxed text-ink-600">{labels.empty}</p>
      ) : (
        <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3 lg:gap-8">
          {visible.map((post, index) => (
            <li key={post.slug}>
              <PostCard
                post={post}
                lang={lang}
                categoryLabel={labels.categories[post.category]}
                delay={Math.min(index, 3) * 45}
                priority={index < 3}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
