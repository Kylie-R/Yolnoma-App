import { describe, expect, it } from "vitest";
import { parseChangelog } from "./changelog";

const valid = `# Changelog

## [1.0.24-preview] - 2026-09-29

### Added

- Preview release notes.

### Fixed

* Safe updater lifecycle.
`;

describe("parseChangelog", () => {
  it("parses prerelease versions and multiple categories", () => {
    const [entry] = parseChangelog(valid);
    expect(entry).toEqual({
      version: "1.0.24-preview",
      date: "2026-09-29",
      categories: {
        Added: ["Preview release notes."],
        Fixed: ["Safe updater lifecycle."],
      },
    });
  });

  it.each([
    ["missing release entry", "# Changelog\n"],
    ["malformed release header", "# Changelog\n\n## 1.0.0\n"],
    [
      "invalid date",
      "# Changelog\n\n## [1.0.0] - 2026-02-30\n\n### Added\n\n- Note\n",
    ],
    [
      "duplicate version",
      `${valid}\n## [1.0.24-preview] - 2026-09-28\n\n### Added\n\n- Duplicate\n`,
    ],
    [
      "missing category bullet",
      "# Changelog\n\n## [1.0.0] - 2026-01-01\n\n### Added\n",
    ],
  ])("rejects %s", (_name, markdown) => {
    expect(() => parseChangelog(markdown)).toThrow();
  });

  it("explains that placeholder dates are invalid release dates", () => {
    const markdown =
      "# Changelog\n\n## [1.2.3] - 2026-09-xx\n\n### Added\n\n- Upcoming feature\n";

    expect(() => parseChangelog(markdown)).toThrow(
      "Invalid release date for version 1.2.3: 2026-09-xx.",
    );
  });
});
