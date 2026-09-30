/**
 * Generates a unified diff string from two texts using LCS (Longest Common Subsequence).
 * Output matches git-compatible unified diff format for use with SideBySideDiffViewer.
 */
export function createUnifiedDiff(
  original: string,
  updated: string,
  filename = "snippet",
): string {
  const oldLines = original.split("\n");
  const newLines = updated.split("\n");

  const n = oldLines.length;
  const m = newLines.length;

  // Compute LCS matrix
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(0),
  );

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      if (oldLines[i] === newLines[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to assemble diff lines
  const diffLines: string[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffLines.unshift(` ${oldLines[i - 1]}`);
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffLines.unshift(`+${newLines[j - 1]}`);
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      diffLines.unshift(`-${oldLines[i - 1]}`);
      i--;
    }
  }

  return `--- a/${filename}\n+++ b/${filename}\n@@ -1,${n} +1,${m} @@\n${diffLines.join("\n")}`;
}
