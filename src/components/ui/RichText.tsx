import Link from "next/link";
import type { JSX } from "react";

import { blockText, isList, type Block, type Inline } from "@/lib/rich-text";

/**
 * Rich text from the CMS, rendered so that the editor controls the
 * *structure* and the page controls the *level*.
 *
 * `baseLevel` is the heading the surrounding page has already reached. A
 * subheading the editor marked as the top level renders one step below it,
 * and a second-level one a step below that. So the same bio renders as
 * `h4`/`h5` inside a team profile whose name is an `h3`, and as `h2`/`h3`
 * in an article whose title is the page's `h1` — without the editor having
 * to know or care where the text is being shown.
 *
 * This is what makes it safe to hand editors real heading control. Before,
 * every heading collapsed to one level and each page picked a tag for it,
 * so the editor's choice did nothing. The alternative — emitting whatever
 * tag was picked — hands an editor the ability to put a second `h1` on a
 * page, or an `h2` above the name it belongs to, which is precisely the
 * outline damage the heading control was asked for in order to prevent.
 */

type BaseLevel = 1 | 2 | 3 | 4;

function headingTag(base: BaseLevel, block: "h2" | "h3"): keyof JSX.IntrinsicElements {
  const level = Math.min(base + (block === "h2" ? 1 : 2), 6);
  return `h${level}` as keyof JSX.IntrinsicElements;
}

function Runs({ runs }: { runs: Inline[] }) {
  return (
    <>
      {runs.map((run, index) => {
        if (run.kind === "link") {
          const className =
            "text-accent-700 underline decoration-ivory-600 underline-offset-4 transition-colors hover:decoration-accent-400";

          /* `next/link` for our own pages so navigation stays client-side;
             a plain anchor for anything off-site, with the `rel` that a
             `target="_blank"` link needs. */
          return run.external ? (
            <a key={index} href={run.href} target="_blank" rel="noreferrer" className={className}>
              {run.text}
            </a>
          ) : (
            <Link key={index} href={run.href} className={className}>
              {run.text}
            </Link>
          );
        }

        let node = <>{run.text}</>;
        if (run.italic) node = <em>{node}</em>;
        if (run.bold) node = <strong className="font-medium text-ink-900">{node}</strong>;
        return <span key={index}>{node}</span>;
      })}
    </>
  );
}

export default function RichText({
  blocks,
  baseLevel,
  className = "space-y-4",
  headingClassName = "pt-2 font-display text-lg leading-snug",
  paragraphClassName = "text-base leading-relaxed text-ink-700",
}: {
  blocks: Block[];
  /** The deepest heading level the page has already used above this text. */
  baseLevel: BaseLevel;
  className?: string;
  headingClassName?: string;
  paragraphClassName?: string;
}) {
  if (!blocks.length) return null;

  return (
    <div className={className}>
      {blocks.map((block, index) => {
        /* Index keys: the text used to be the key, which collapsed two
           identical paragraphs into one rendered node. Blocks are never
           reordered on the client, so the index is stable here. */
        const key = `${index}-${blockText(block).slice(0, 24)}`;

        if (isList(block)) {
          const List = block.type;
          return (
            <List
              key={key}
              className={
                block.type === "ol"
                  ? "ml-5 list-decimal space-y-2 marker:text-accent-600"
                  : "ml-5 list-disc space-y-2 marker:text-accent-600"
              }
            >
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className={paragraphClassName}>
                  <Runs runs={item} />
                </li>
              ))}
            </List>
          );
        }

        if (block.type === "p") {
          return (
            <p key={key} className={paragraphClassName}>
              <Runs runs={block.content} />
            </p>
          );
        }

        const Heading = headingTag(baseLevel, block.type);
        return (
          <Heading key={key} className={headingClassName}>
            <Runs runs={block.content} />
          </Heading>
        );
      })}
    </div>
  );
}
