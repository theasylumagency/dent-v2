import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { htmlLang, isLocale, locales, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPosts, getUsedCategories } from "@/lib/news";
import { getSeo } from "@/lib/seo";
import { site } from "@/lib/site";
import PageHero from "@/components/services/PageHero";
import BookingCta from "@/components/services/BookingCta";
import NewsList from "@/components/news/NewsList";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = (await getDictionary(lang)).news;
  const meta = await getSeo("news", lang, {
    title: t.metaTitle,
    description: t.metaDescription,
  });

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}/news`,
      languages: Object.fromEntries([
        ...locales.map((l) => [htmlLang[l], `/${l}/news`]),
        ["x-default", "/en/news"],
      ]),
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: meta.title,
      description: meta.description,
      locale: htmlLang[lang].replace("-", "_"),
      url: `/${lang}/news`,
    },
  };
}

export default async function NewsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const t = dict.news;
  const [posts, categories] = await Promise.all([getPosts(locale), getUsedCategories()]);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.breadcrumbHome, item: `${site.url}/${locale}` },
      { "@type": "ListItem", position: 2, name: dict.nav.news, item: `${site.url}/${locale}/news` },
    ],
  };

  const listLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: t.title,
    description: t.metaDescription,
    url: `${site.url}/${locale}/news`,
    publisher: { "@type": "Dentist", "@id": `${site.url}/#clinic`, name: site.name },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedAt,
      url: `${site.url}/${locale}/news/${post.slug}`,
      image: `${site.url}${post.cover}`,
    })),
  };

  return (
    <>
      <PageHero
        eyebrow={dict.nav.news}
        title={t.title}
        lead={t.lead}
        crumbLabel={t.breadcrumbLabel}
        crumbs={[{ label: t.breadcrumbHome, href: `/${locale}` }, { label: dict.nav.news }]}
      />

      <section className="section relative overflow-hidden border-b border-ivory-400 bg-ivory-100">
        <div className="aura -left-40 top-1/4 h-[26rem] w-[26rem] opacity-25" aria-hidden="true" />

        <div className="shell relative">
          <NewsList
            posts={posts}
            lang={locale}
            categories={categories}
            labels={{
              filterLabel: t.filterLabel,
              all: t.all,
              categories: t.categories,
              empty: t.emptyLabel,
            }}
          />
        </div>
      </section>

      <BookingCta dict={dict} lang={locale} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listLd) }}
      />
    </>
  );
}
