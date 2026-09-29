import changelogMarkdown from "../../../CHANGELOG.md?raw";

export const CHANGELOG_CATEGORIES = [
  "Added",
  "Improved",
  "Fixed",
  "Changed",
  "Removed",
] as const;

export type ChangelogCategory = (typeof CHANGELOG_CATEGORIES)[number];

export interface ChangelogEntry {
  version: string;
  date: string;
  categories: Partial<Record<ChangelogCategory, string[]>>;
}

const RELEASE_HEADER = /^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})$/;
const CATEGORY_HEADER = /^### (Added|Improved|Fixed|Changed|Removed)$/;
const BULLET = /^[-*]\s+(.+)$/;

function isValidIsoDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date;
}

export function parseChangelog(markdown: string): ChangelogEntry[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "# Changelog") {
    throw new Error("CHANGELOG.md must begin with '# Changelog'.");
  }

  const entries: ChangelogEntry[] = [];
  const versions = new Set<string>();
  let current: ChangelogEntry | null = null;
  let category: ChangelogCategory | null = null;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    if (line.startsWith("## ")) {
      const match = RELEASE_HEADER.exec(line);
      if (!match) {
        throw new Error(`Malformed release header on line ${index + 1}.`);
      }
      const [, version, date] = match;
      if (versions.has(version)) {
        throw new Error(`Duplicate changelog version: ${version}.`);
      }
      if (!isValidIsoDate(date)) {
        throw new Error(`Invalid release date for version ${version}: ${date}.`);
      }
      current = { version, date, categories: {} };
      entries.push(current);
      versions.add(version);
      category = null;
      continue;
    }

    if (line.startsWith("### ")) {
      if (!current) {
        throw new Error(`Category appears before a release on line ${index + 1}.`);
      }
      const match = CATEGORY_HEADER.exec(line);
      if (!match) {
        throw new Error(`Unsupported changelog category on line ${index + 1}.`);
      }
      category = match[1] as ChangelogCategory;
      if (current.categories[category]) {
        throw new Error(
          `Duplicate ${category} category for version ${current.version}.`,
        );
      }
      current.categories[category] = [];
      continue;
    }

    if (line.startsWith("#")) {
      throw new Error(`Unexpected heading on line ${index + 1}.`);
    }

    const bullet = BULLET.exec(line);
    if (!bullet || !current || !category) {
      throw new Error(`Malformed changelog content on line ${index + 1}.`);
    }
    current.categories[category]?.push(bullet[1].trim());
  }

  if (entries.length === 0) {
    throw new Error("CHANGELOG.md does not contain any release entries.");
  }

  for (const entry of entries) {
    const itemCount = Object.values(entry.categories).reduce(
      (total, items) => total + (items?.length ?? 0),
      0,
    );
    if (itemCount === 0) {
      throw new Error(`Changelog entry for version ${entry.version} is empty.`);
    }
  }

  return entries;
}

export function getChangelogEntry(version: string): ChangelogEntry | null {
  return parseChangelog(changelogMarkdown).find(
    (entry) => entry.version === version,
  ) ?? null;
}

export function getChangelogMarkdown(): string {
  return changelogMarkdown;
}
