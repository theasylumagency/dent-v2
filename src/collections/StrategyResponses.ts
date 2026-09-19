import type { CollectionConfig } from "payload";
import { isAdmin } from "../access/roles";
import { FORM_VERSION } from "../lib/strategy/schema";

const readonly = { admin: { readOnly: true }, access: { update: () => false } } as const;
/** Invitations are created by the operator script; no public collection writes. */
export const StrategyResponses: CollectionConfig = {
  slug: "strategy-responses",
  labels: { singular: "სტრატეგიის კითხვარი", plural: "სტრატეგიის კითხვარები" },
  access: {
    read: ({ req }) => isAdmin(req.user),
    create: () => false,
    update: ({ req }) => isAdmin(req.user),
    delete: ({ req }) => isAdmin(req.user),
  },
  admin: {
    group: "მარკეტინგი", useAsTitle: "title", hideAPIURL: true,
    hidden: ({ user }) => user?.role !== "admin",
    defaultColumns: ["title", "status", "updatedAt", "expiresAt"],
    description: "პასუხები ხელმისაწვდომია მხოლოდ ადმინისტრატორებისთვის. მოწვევის გასაუქმებლად მონიშნეთ წვდომის გაუქმება.",
  },
  lockDocuments: false, disableDuplicate: true,
  fields: [
    { name: "title", type: "text", label: "სახელი", required: true },
    { name: "tokenHash", type: "text", required: true, unique: true, admin: { hidden: true }, access: { read: () => false, update: () => false } },
    { name: "formVersion", type: "text", defaultValue: FORM_VERSION, required: true, label: "ფორმის ვერსია", ...readonly },
    { name: "status", type: "select", label: "სტატუსი", defaultValue: "draft", required: true, options: [{ label: "მიმდინარე", value: "draft" }, { label: "გაგზავნილი", value: "submitted" }], ...readonly },
    { name: "revoked", type: "checkbox", label: "წვდომის გაუქმება", defaultValue: false },
    { name: "expiresAt", type: "date", label: "მოწვევის მოქმედების ბოლო ვადა", required: true },
    { name: "deleteAfter", type: "date", label: "პასუხების შენახვის ბოლო ვადა", required: true },
    { name: "privacyContact", type: "text", label: "პასუხების წაშლისთვის საკონტაქტო პირი / არხი", required: true },
    { name: "answers", type: "json", label: "პასუხები", defaultValue: {}, ...readonly },
    { name: "step", type: "number", defaultValue: -1, required: true, label: "შევსების ეტაპი", ...readonly },
    { name: "revision", type: "number", defaultValue: 0, required: true, label: "შენახვის ვერსია", ...readonly },
    { name: "startedAt", type: "date", label: "შევსების დაწყება", ...readonly },
    { name: "completedAt", type: "date", label: "გაგზავნის თარიღი", ...readonly },
  ],
};
