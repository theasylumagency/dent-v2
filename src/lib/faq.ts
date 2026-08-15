import type { Locale } from "@/i18n/config";
import { cms } from "./cms";

/**
 * Frequently asked questions, from Payload's `faq` collection.
 *
 * `answer` is plain text rather than rich text on purpose: the answers are
 * emitted as `FAQPage` structured data, which takes a string. Rich text would
 * have to be flattened before it could be published, and a heading or a list
 * inside an answer would simply disappear at that point — better not to offer
 * the editor formatting the format cannot carry.
 */

export type FaqItem = { q: string; a: string };

export async function getFaq(lang: Locale): Promise<FaqItem[]> {
  const payload = await cms();
  const result = await payload.find({
    collection: "faq",
    locale: lang,
    depth: 0,
    limit: 200,
    sort: "order",
  });

  return result.docs.map((doc) => ({
    q: String(doc.question),
    a: String(doc.answer),
  }));
}
