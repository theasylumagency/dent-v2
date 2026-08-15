import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPost, getPostSlugs, getPosts } from "@/lib/news";
import { formatPostDate } from "@/lib/news-shared";
import { route } from "@/lib/routes";
import { site } from "@/lib/site";
import { ArrowUpRight } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import Breadcrumbs from "@/components/services/Breadcrumbs";
import BookingCta from "@/components/services/BookingCta";
import PostCard from "@/components/news/PostCard";

export async function generateStaticParams() {
  return (await getPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const post = await getPost(slug, lang);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/${lang}/news/${slug}`,
      languages: Object.fromEntries([
        ...locales.map((l) => [htmlLang[l], `/${l}/news/${slug}`]),
        ["x-default", `/en/news/${slug}`],
      ]),
    },
    openGraph: {
      type: "article",
      siteName: site.name,
      title: post.title,
      description: post.excerpt,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}/news/${slug}`,
      publishedTime: post.publishedAt,
      images: [{ url: post.cover, alt: post.coverAlt }],
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.news;
  const post = await getPost(slug, locale);
  if (!post) notFound();

  const newsHref = route(locale, "news");
  const related = (await getPosts(locale))
    .filter((item) => item.slug !== post.slug)
    .slice(0, 3);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `${site.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: dict.nav.news, item: `${site.url}/${locale}/news` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${site.url}/${locale}/news/${post.slug}`,
      },
    ],
  };

  /* `BlogPosting` with the clinic as both author and publisher. On a
     medical site the author matters — an unattributed health article is
     the kind of page search engines discount and readers should too.
     TODO: once posts carry a byline in the CMS, point `author` at the
     doctor's `Person` node on the about page instead of the clinic. */
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    inLanguage: htmlLang[post.isFallback ? "ka" : locale],
    image: `${site.url}${post.cover}`,
    url: `${site.url}/${locale}/news/${post.slug}`,
    mainEntityOfPage: `${site.url}/${locale}/news/${post.slug}`,
    author: { "@type": "Dentist", "@id": `${site.url}/#clinic`, name: site.name },
    publisher: { "@type": "Dentist", "@id": `${site.url}/#clinic`, name: site.name },
  };

  return (
    <>
      <article>
        <header className="relative grain overflow-hidden border-b border-ivory-400 bg-ivory-100 pb-14 pt-28 lg:pb-16 lg:pt-40">
          <div className="aura -left-52 -top-24 h-[34rem] w-[34rem] opacity-40" aria-hidden="true" />

          <div className="shell relative">
            <Breadcrumbs
              label={t.breadcrumbLabel}
              items={[
                { label: t.breadcrumbHome, href: `/${locale}` },
                { label: dict.nav.news, href: newsHref },
                { label: post.title },
              ]}
            />

            <Reveal className="mt-8 max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="label-micro text-accent-700">{t.categories[post.category]}</span>
                <span aria-hidden="true" className="text-ivory-600">
                  ·
                </span>
                <time dateTime={post.publishedAt} className="text-xs text-ink-600">
                  {formatPostDate(post.publishedAt, locale)}
                </time>
              </div>

              <h1 className="mt-6 fluid-display font-display">{post.title}</h1>
              <p className="mt-6 text-base leading-relaxed text-ink-700 sm:text-lg">
                {post.excerpt}
              </p>

              {/* Shown when this locale has no translation and the reader is
                  getting the Georgian text. Silently serving another
                  language without saying so is worse than saying so. */}
              {post.isFallback && (
                <p className="mt-6 rounded-card border border-ivory-500 bg-ivory-50 px-5 py-4 text-sm leading-relaxed text-ink-600">
                  {t.fallbackNotice}
                </p>
              )}
            </Reveal>
          </div>
        </header>

        <div className="section-tight bg-ivory-100">
          <div className="shell">
            <Reveal className="relative mx-auto aspect-[16/9] max-w-4xl overflow-hidden rounded-card bg-ivory-300 shadow-soft">
              <Image
                src={post.cover}
                alt={post.coverAlt}
                fill
                sizes="(min-width: 1024px) 56rem, 100vw"
                priority
                className="object-cover"
              />
            </Reveal>

            <div className="mx-auto mt-14 max-w-2xl">
              {post.body.map((block) =>
                block.type === "h2" ? (
                  <Reveal key={block.text}>
                    <h2 className="mt-12 font-display text-2xl leading-snug first:mt-0 lg:text-3xl">
                      {block.text}
                    </h2>
                  </Reveal>
                ) : (
                  <Reveal key={block.text}>
                    <p className="mt-6 text-base leading-relaxed text-ink-700 first:mt-0 sm:text-lg">
                      {block.text}
                    </p>
                  </Reveal>
                ),
              )}

              <Reveal>
                <Link
                  href={newsHref}
                  className="group mt-14 inline-flex items-center gap-2.5 text-sm font-medium text-accent-600 transition-colors hover:text-accent-700"
                >
                  {t.backToList}
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent-300 bg-ivory-50 transition-all duration-500 group-hover:bg-accent-300 group-hover:text-ink-900">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section relative border-y border-ivory-400 bg-ivory-200">
          <div className="shell">
            <Reveal>
              <h2 className="font-display text-2xl leading-snug lg:text-3xl">{t.relatedLabel}</h2>
            </Reveal>

            <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {related.map((item, index) => (
                <li key={item.slug}>
                  <PostCard
                    post={item}
                    lang={locale}
                    categoryLabel={t.categories[item.category]}
                    delay={index * 45}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <BookingCta dict={dict} lang={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
    </>
  );
}
