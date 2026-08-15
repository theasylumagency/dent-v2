export type CredentialGroups = {
  education: readonly string[];
  experience: readonly string[];
  training: readonly string[];
};

export type CredentialLabels = {
  education: string;
  experience: string;
  training: string;
};

/**
 * Education / experience / training, rendered from one loop.
 *
 * Shared between the lead doctor's section and the four profiles below it
 * so the two cannot drift apart visually — the chief doctor's credentials
 * looking different from everyone else's reads as a hierarchy nobody
 * intended.
 *
 * An empty group drops its heading rather than printing it over nothing,
 * which is what makes this safe to use for a doctor whose CV is partial.
 */
export default function Credentials({
  groups,
  labels,
}: {
  groups: CredentialGroups;
  labels: CredentialLabels;
}) {
  const columns = [
    { key: "education", label: labels.education, items: groups.education },
    { key: "experience", label: labels.experience, items: groups.experience },
    { key: "training", label: labels.training, items: groups.training },
  ].filter((column) => column.items.length > 0);

  if (!columns.length) return null;

  return (
    <div className="space-y-7">
      {columns.map((column) => (
        <div key={column.key} className="border-t border-ivory-400 pt-5">
          <h4 className="label-micro">{column.label}</h4>
          <ul className="mt-4 space-y-2.5">
            {column.items.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-ink-700">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-400"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Language chips. Same shape wherever a person is described. */
export function LanguageChips({ label, languages }: { label: string; languages: readonly string[] }) {
  if (!languages.length) return null;

  return (
    <div>
      <p className="label-micro">{label}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {languages.map((language) => (
          <li
            key={language}
            className="rounded-full border border-ivory-600 bg-ivory-50 px-3.5 py-1.5 text-xs text-ink-700"
          >
            {language}
          </li>
        ))}
      </ul>
    </div>
  );
}
