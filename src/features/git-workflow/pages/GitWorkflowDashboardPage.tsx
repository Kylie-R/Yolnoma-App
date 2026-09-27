import { useMemo, useState } from "react";
import {
  Activity,
  GitBranch,
  GitCommitHorizontal,
  GitMerge,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/shared/ui";

const MOCK_BRANCHES = [
  { name: "main", ahead: 0, behind: 0, status: "clean" },
  { name: "feature/api-studio", ahead: 4, behind: 1, status: "ahead" },
  { name: "feature/dns-audit", ahead: 2, behind: 0, status: "ahead" },
  { name: "hotfix/ssl-check", ahead: 1, behind: 2, status: "diverged" },
];

const MOCK_COMMITS = [
  {
    hash: "a1b2c3",
    message: "feat: add API testing studio",
    author: "Jasurbek",
    time: "2h ago",
  },
  {
    hash: "d4e5f6",
    message: "fix: clean DNS record parsing",
    author: "Jasurbek",
    time: "1d ago",
  },
  {
    hash: "g7h8i9",
    message: "docs: update roadmap",
    author: "Jasurbek",
    time: "3d ago",
  },
];

export default function GitWorkflowDashboardPage() {
  const [filter, setFilter] = useState("all");

  const filteredBranches = useMemo(() => {
    if (filter === "all") return MOCK_BRANCHES;
    return MOCK_BRANCHES.filter((branch) => branch.status === filter);
  }, [filter]);

  return (
    <div className="mx-auto min-h-full max-w-7xl space-y-8 p-6 text-[var(--text-primary)]">
      <header className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          <GitBranch size={18} />
          Git Workflow Dashboard
        </div>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-white md:text-5xl">
              See branch health, commit flow, and divergence quickly
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">
              Keep track of branch safety, commit velocity, and pending
              integration work before releasing or merging.
            </p>
          </div>
          <Button variant="primary" className="w-fit">
            <RefreshCcw size={14} className="mr-2" /> Refresh
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={GitBranch}
          label="Branches"
          value="4"
          accent="text-sky-400"
        />
        <MetricCard
          icon={GitCommitHorizontal}
          label="Recent commits"
          value="12"
          accent="text-violet-400"
        />
        <MetricCard
          icon={Activity}
          label="Diverged"
          value="1"
          accent="text-amber-400"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Branch status</h2>
            <div className="flex gap-2">
              {(["all", "clean", "ahead", "diverged"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] ${filter === item ? "border-[var(--accent)] bg-[var(--accent)]/15 text-white" : "border-white/[0.08] bg-white/[0.02] text-white/55"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredBranches.map((branch) => (
              <div
                key={branch.name}
                className="rounded-xl border border-white/[0.06] bg-black/10 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm text-white">
                      {branch.name}
                    </div>
                    <div className="mt-1 text-xs text-white/45">
                      ahead {branch.ahead} • behind {branch.behind}
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${branch.status === "clean" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : branch.status === "ahead" ? "border-sky-500/30 bg-sky-500/10 text-sky-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}
                  >
                    {branch.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
          <div className="mb-4 flex items-center gap-2 text-white">
            <GitMerge size={18} className="text-[var(--accent)]" />
            <h2 className="text-xl font-semibold">Recent commits</h2>
          </div>
          <div className="space-y-3">
            {MOCK_COMMITS.map((commit) => (
              <div
                key={commit.hash}
                className="rounded-xl border border-white/[0.06] bg-black/10 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="font-mono text-[11px] text-[var(--accent)]">
                    {commit.hash}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-white/40">
                    {commit.time}
                  </div>
                </div>
                <div className="mt-2 text-sm text-white/80">
                  {commit.message}
                </div>
                <div className="mt-2 text-[11px] text-white/45">
                  by {commit.author}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof GitBranch;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[var(--bg-elevated)] p-5 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-lg border border-white/[0.08] bg-white/[0.02] p-2 ${accent}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
        {label}
      </div>
    </div>
  );
}
