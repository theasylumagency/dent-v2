import { parseArgs } from "node:util";
import { writeFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { newInvitationToken, hashToken } from "../src/lib/strategy/access";
import { allSections, answerLabel, fieldsFor, FORM_VERSION, isVisible, type Answers } from "../src/lib/strategy/schema";
import { site } from "../src/lib/site";

nextEnv.loadEnvConfig(process.cwd());
// Maintenance commands must never trigger development schema push.
Object.assign(process.env, { NODE_ENV: "production" });
const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    contact: { type: "string" }, title: { type: "string" }, origin: { type: "string" },
    days: { type: "string", default: "30" }, retention: { type: "string", default: "90" },
    id: { type: "string" }, output: { type: "string" },
  },
});
const command = positionals[0];
if (!["invite", "export", "revoke", "purge"].includes(command ?? "")) {
  throw new Error('Usage: npm run strategy -- invite --contact "Name / contact" [--origin URL] | export --id ID [--output FILE] | revoke --id ID | purge');
}
const origin = new URL(values.origin ?? site.url);
if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) throw new Error("Invalid origin");
const days = Number(values.days), retention = Number(values.retention);
if (!Number.isInteger(days) || days < 1 || days > 90 || !Number.isInteger(retention) || retention < days || retention > 365) throw new Error("Access: 1–90 days; retention: access duration to 365 days.");
if (command === "invite" && !values.contact?.trim()) throw new Error("--contact is required before creating an invitation.");
if (["export", "revoke"].includes(command!) && !/^\d+$/.test(values.id ?? "")) throw new Error("--id is required.");

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");
const payload = await getPayload({ config });
try {
  if (command === "invite") {
    const token = newInvitationToken();
    const record = await payload.create({
      collection: "strategy-responses", overrideAccess: true,
      data: {
        title: values.title?.trim() || "Total Charm Dent",
        tokenHash: hashToken(token), privacyContact: values.contact!.trim(),
        formVersion: FORM_VERSION, status: "draft", revision: 0, step: -1,
        expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
        deleteAfter: new Date(Date.now() + retention * 86400000).toISOString(),
      },
    });
    // Only the operator sees the bearer link; the database stores its hash.
    console.log(JSON.stringify({ id: record.id, url: origin.origin + "/strategy#access=" + token, expiresAt: record.expiresAt }, null, 2));
  } else if (command === "export") {
    const record = await payload.findByID({ collection: "strategy-responses", id: Number(values.id), overrideAccess: true });
    const answers = (record.answers || {}) as Answers;
    const result = JSON.stringify({
      id: record.id, title: record.title, status: record.status, formVersion: record.formVersion,
      startedAt: record.startedAt, completedAt: record.completedAt, updatedAt: record.updatedAt,
      sections: allSections.filter(section => isVisible(section.when, answers)).map(section => ({
        title: section.title, answers: fieldsFor(section, answers).map(field => ({ question: field.label, answer: answerLabel(field, answers[field.id]) })),
      })),
    }, null, 2);
    if (values.output) { await writeFile(values.output, result, { flag: "wx" }); console.log("Export saved."); }
    else console.log(result);
  } else if (command === "revoke") {
    await payload.update({ collection: "strategy-responses", id: Number(values.id), overrideAccess: true, data: { revoked: true } });
    console.log("Invitation revoked.");
  } else {
    const result = await payload.delete({ collection: "strategy-responses", where: { deleteAfter: { less_than_equal: new Date().toISOString() } }, overrideAccess: true });
    console.log("Expired response records deleted: " + result.docs.length);
  }
} finally { await payload.destroy(); }
