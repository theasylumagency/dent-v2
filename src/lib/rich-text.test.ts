import assert from "node:assert/strict";
import { test } from "node:test";

import { blockText, toBlocks, type ListBlock, type TextBlock } from "./rich-text";

/**
 * The Lexical converter, against the shapes Payload actually stores.
 *
 * Worth testing rather than eyeballing because its failure mode is silent:
 * an unhandled node type is dropped, and a dropped node looks exactly like
 * an editor who never typed anything. The previous version dropped lists,
 * links and every heading level and nobody noticed for months.
 *
 * Run with `npm run test:richtext`.
 */

/* Node builders, named after what the editor produces. */
const text = (value: string, format = 0) => ({ type: "text", text: value, format });
const paragraph = (...children: unknown[]) => ({ type: "paragraph", children });
const heading = (tag: string, value: string) => ({
    type: "heading",
    tag,
    children: [text(value)],
});
const list = (listType: string, ...items: string[]) => ({
    type: "list",
    listType,
    children: items.map((item) => ({ type: "listitem", children: [text(item)] })),
});
const doc = (...children: unknown[]) => ({ root: { children } });

test("paragraphs and headings keep the level the editor chose", () => {
    const blocks = toBlocks(
        doc(paragraph(text("პირველი აბზაცი")), heading("h2", "სათაური"), heading("h3", "ქვესათაური")),
        "ka",
    );

    assert.deepEqual(
        blocks.map((block) => block.type),
        ["p", "h2", "h3"],
    );
    assert.equal(blockText(blocks[1]), "სათაური");
});

test("h1 is clamped to h2 and h4–h6 collapse to h3", () => {
    /* h1 would give the page a second one; h4+ has no style of its own.
       Both are clamped rather than dropped so pre-existing content that
       used them still renders. */
    const blocks = toBlocks(doc(heading("h1", "A"), heading("h4", "B"), heading("h6", "C")), "ka");

    assert.deepEqual(
        blocks.map((block) => block.type),
        ["h2", "h3", "h3"],
    );
});

test("bulleted and numbered lists survive", () => {
    const blocks = toBlocks(doc(list("bullet", "ერთი", "ორი"), list("number", "პირველი")), "ka");

    assert.deepEqual(
        blocks.map((block) => block.type),
        ["ul", "ol"],
    );
    const [ul] = blocks as unknown as [ListBlock];
    assert.equal(ul.items.length, 2);
    assert.equal(ul.items[1][0].text, "ორი");
});

test("bold and italic are carried, and adjacent identical runs merge", () => {
    const blocks = toBlocks(
        doc(paragraph(text("plain "), text("bold", 1), text("er", 1), text(" and "), text("it", 2))),
        "ka",
    );

    const [para] = blocks as unknown as [TextBlock];
    assert.deepEqual(
        para.content.map((run) => [run.text, "bold" in run ? run.bold : undefined]),
        [
            ["plain ", undefined],
            ["bolder", true],
            [" and ", undefined],
            ["it", undefined],
        ],
    );
    assert.equal(para.content[3].kind === "text" && para.content[3].italic, true);
});

test("a custom link keeps its URL and is marked external", () => {
    const blocks = toBlocks(
        doc(
            paragraph({
                type: "link",
                fields: { linkType: "custom", url: "https://example.com" },
                children: [text("წყარო")],
            }),
        ),
        "ka",
    );

    const [para] = blocks as unknown as [TextBlock];
    assert.deepEqual(para.content, [
        { kind: "link", text: "წყარო", href: "https://example.com", external: true },
    ]);
});

test("an internal link is rebuilt from the collection and slug, per locale", () => {
    const linkFor = (lang: "ka" | "en") => {
        const block = toBlocks(
            doc(
                paragraph({
                    type: "link",
                    fields: {
                        linkType: "internal",
                        doc: { relationTo: "doctors", value: { slug: "archil-apkhadze" } },
                    },
                    children: [text("არჩილ აფხაძე")],
                }),
            ),
            lang,
        )[0] as TextBlock;

        const run = block.content[0];
        assert.equal(run.kind, "link");
        return run;
    };

    assert.deepEqual(linkFor("ka"), {
        kind: "link",
        text: "არჩილ აფხაძე",
        href: "/ka/about/archil-apkhadze",
    });
    assert.deepEqual(linkFor("en"), {
        kind: "link",
        text: "არჩილ აფხაძე",
        href: "/en/about/archil-apkhadze",
    });
});

test("a link to a collection with no public URL degrades to plain text", () => {
    /* Media has no page. An anchor to one would 404; the words still say
       what the author meant. */
    const blocks = toBlocks(
        doc(
            paragraph({
                type: "link",
                fields: { linkType: "internal", doc: { relationTo: "media", value: { slug: "x" } } },
                children: [text("ფაილი")],
            }),
        ),
        "ka",
    );

    const [para] = blocks as unknown as [TextBlock];
    assert.deepEqual(para.content, [{ kind: "text", text: "ფაილი" }]);
});

test("empty and unknown nodes are dropped, not rendered", () => {
    const blocks = toBlocks(
        doc(
            paragraph(text("   ")),
            { type: "horizontalrule" },
            { type: "upload", value: { url: "/x.png" } },
            paragraph(text("კარგი")),
        ),
        "ka",
    );

    assert.deepEqual(
        blocks.map((block) => block.type),
        ["p"],
    );
    assert.equal(blockText(blocks[0]), "კარგი");
});

test("surrounding whitespace is trimmed without eating inner spacing", () => {
    const blocks = toBlocks(doc(paragraph(text("  ერთი "), text("ორი  "))), "ka");
    assert.equal(blockText(blocks[0]), "ერთი ორი");
});

test("missing or malformed rich text is an empty document, not a crash", () => {
    assert.deepEqual(toBlocks(null, "ka"), []);
    assert.deepEqual(toBlocks(undefined, "ka"), []);
    assert.deepEqual(toBlocks({}, "ka"), []);
    assert.deepEqual(toBlocks({ root: {} }, "ka"), []);
});
