import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const CHANGELOG_CATEGORIES = ["Added", "Improved", "Fixed", "Changed", "Removed"];
const RELEASE_HEADER = /^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})$/;
const CATEGORY_HEADER = /^### (Added|Improved|Fixed|Changed|Removed)$/;
const BULLET = /^[-*]\s+(.+)$/;

export function parseChangelog(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  if (lines[0]?.trim() !== "# Changelog") {
    throw new Error("CHANGELOG.md must begin with '# Changelog'.");
  }

  const entries = [];
  const versions = new Set();
  let current = null;
  let category = null;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) continue;

    if (line.startsWith("## ")) {
      const match = RELEASE_HEADER.exec(line);
      if (!match) throw new Error(`Malformed release header on line ${index + 1}.`);
      const [, version, date] = match;
      if (versions.has(version)) throw new Error(`Duplicate changelog version: ${version}.`);
      if (!isValidDate(date)) throw new Error(`Invalid release date for version ${version}: ${date}.`);
      current = { version, date, categories: {} };
      entries.push(current);
      versions.add(version);
      category = null;
      continue;
    }

    if (line.startsWith("### ")) {
      if (!current) throw new Error(`Category appears before a release on line ${index + 1}.`);
      const match = CATEGORY_HEADER.exec(line);
      if (!match) throw new Error(`Unsupported changelog category on line ${index + 1}.`);
      category = match[1];
      if (current.categories[category]) throw new Error(`Duplicate ${category} category for version ${current.version}.`);
      current.categories[category] = [];
      continue;
    }

    if (line.startsWith("#")) throw new Error(`Unexpected heading on line ${index + 1}.`);
    if (!current) continue;
    const bullet = BULLET.exec(line);
    if (!bullet || !category) throw new Error(`Malformed changelog content on line ${index + 1}.`);
    current.categories[category].push(bullet[1].trim());
  }

  if (entries.length === 0) throw new Error("CHANGELOG.md does not contain any release entries.");
  for (const entry of entries) {
    const count = Object.values(entry.categories).reduce((total, items) => total + items.length, 0);
    if (count === 0) throw new Error(`Changelog entry for version ${entry.version} is empty.`);
  }
  return entries;
}

function isValidDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export function parseSemver(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(version);
  if (!match) throw new Error(`Invalid semantic version: ${version}.`);
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4]?.split(".") ?? [] };
}

export function compareSemver(left, right) {
  const a = parseSemver(left);
  const b = parseSemver(right);
  for (const key of ["major", "minor", "patch"]) {
    if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  }
  if (a.prerelease.length === 0 && b.prerelease.length === 0) return 0;
  if (a.prerelease.length === 0) return 1;
  if (b.prerelease.length === 0) return -1;
  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    if (a.prerelease[index] === undefined) return -1;
    if (b.prerelease[index] === undefined) return 1;
    const leftIdentifier = a.prerelease[index];
    const rightIdentifier = b.prerelease[index];
    if (leftIdentifier === rightIdentifier) continue;
    const leftNumeric = /^\d+$/.test(leftIdentifier);
    const rightNumeric = /^\d+$/.test(rightIdentifier);
    if (leftNumeric && rightNumeric) return Number(leftIdentifier) > Number(rightIdentifier) ? 1 : -1;
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftIdentifier > rightIdentifier ? 1 : -1;
  }
  return 0;
}

function readVersions() {
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const tauri = JSON.parse(fs.readFileSync(path.join(ROOT, "src-tauri/tauri.conf.json"), "utf8"));
  const cargo = fs.readFileSync(path.join(ROOT, "src-tauri/Cargo.toml"), "utf8").match(/^version\s*=\s*"([^"]+)"/m)?.[1];
  if (!cargo) throw new Error("Could not read version from src-tauri/Cargo.toml.");
  return { package: packageJson.version, tauri: tauri.version, cargo };
}

function previousReleaseVersion(tag) {
  const tags = requireGitTags();
  const current = tag.replace(/^v/, "");
  return tags
    .map((value) => value.replace(/^v/, ""))
    .filter((value) => value !== current)
    .filter((value) => { try { parseSemver(value); return true; } catch { return false; } })
    .sort((a, b) => compareSemver(b, a))[0] ?? null;
}

function requireGitTags() {
  const output = process.env.RELEASE_TAGS ?? "";
  return output.split(/\r?\n/).map((tag) => tag.trim()).filter(Boolean);
}

export function validateRelease({ tag, tags = [] }) {
  const version = tag.replace(/^v/, "");
  parseSemver(version);
  const versions = readVersions();
  if (new Set(Object.values(versions)).size !== 1) {
    throw new Error(`Version mismatch: package.json=${versions.package}, Cargo.toml=${versions.cargo}, tauri.conf.json=${versions.tauri}.`);
  }
  if (versions.package !== version) throw new Error(`Release tag ${tag} does not match application version ${versions.package}.`);

  const changelog = parseChangelog(fs.readFileSync(path.join(ROOT, "CHANGELOG.md"), "utf8"));
  const entry = changelog.find((item) => item.version === version);
  if (!entry) throw new Error(`Changelog entry for version ${version} is missing.`);
  if (!isValidDate(entry.date)) throw new Error(`Changelog release date for version ${version} is invalid.`);

  const previous = tags.map((value) => value.replace(/^v/, "")).filter((value) => value !== version).filter((value) => {
    try { parseSemver(value); return true; } catch { return false; }
  }).sort((a, b) => compareSemver(b, a))[0];
  if (previous && compareSemver(version, previous) <= 0) {
    throw new Error(`Release ${version} must be newer than previous release ${previous}.`);
  }
  return { version, entry, previous: previous ?? null };
}

export function formatReleaseNotes(entry) {
  return CHANGELOG_CATEGORIES.filter((category) => entry.categories[category]?.length).map((category) => [
    `### ${category}`,
    "",
    ...entry.categories[category].map((item) => `- ${item}`),
  ].join("\n")).join("\n\n");
}

function getArgument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function run() {
  const command = process.argv[2];
  if (command === "validate") {
    const tag = getArgument("--tag");
    if (!tag) throw new Error("validate requires --tag.");
    const tags = requireGitTags();
    const result = validateRelease({ tag, tags });
    console.log(`Release metadata valid for ${result.version}; changelog entry dated ${result.entry.date}.`);
    return;
  }

  if (command === "generate-manifest") {
    const tag = getArgument("--tag");
    const exe = getArgument("--exe");
    const signature = getArgument("--signature");
    const output = getArgument("--output");
    const notesOutput = getArgument("--notes-output");
    const repo = getArgument("--repo");
    if (!tag || !exe || !signature || !output || !notesOutput || !repo) throw new Error("generate-manifest requires --tag, --exe, --signature, --output, --notes-output, and --repo.");
    const { version, entry } = validateRelease({ tag, tags: requireGitTags() });
    const notes = formatReleaseNotes(entry);
    const releaseUrl = `https://github.com/${repo}/releases/download/${tag}`;
    const manifest = {
      version,
      notes,
      pub_date: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
      platforms: {
        "windows-x86_64": {
          signature: fs.readFileSync(signature, "utf8").trim(),
          url: `${releaseUrl}/${exe}`,
        },
      },
    };
    if (!manifest.platforms["windows-x86_64"].signature) throw new Error("Updater signature is empty.");
    fs.writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`);
    fs.writeFileSync(notesOutput, `${notes}\n`);
    JSON.parse(fs.readFileSync(output, "utf8"));
    console.log(`Generated updater manifest for ${version}: ${output}`);
    return;
  }

  throw new Error("Unknown command. Use validate or generate-manifest.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { run(); } catch (error) { console.error(`::error::${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; }
}
