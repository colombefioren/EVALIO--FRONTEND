"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CalendarClock, Inbox, Lock, LockOpen, Plus, Search, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Topbar } from "@/components/Topbar";
import { ProjectCard } from "@/components/ProjectCard";
import { AddProjectModal } from "@/components/AddProjectModal";
import { LeaderboardTable, Podium } from "@/components/Leaderboard";
import { EmptyState, ErrorBanner } from "@/components/EmptyState";
import { PhaseBadge } from "@/components/status";
import { Stagger, StaggerItem } from "@/components/motion";
import { useHackathon, useHackathons, useLeaderboard, useUpdateHackathon } from "@/lib/hooks/useHackathons";
import { isEvaluating, splitList, type Criterion, type Hackathon, type Project } from "@/lib/api";
import { JUDGE_COLORS } from "@/lib/constants";
import { formatDate, formatScore, timeUntil } from "@/lib/utils";

type Tab = "leaderboard" | "submissions";
type Filter = "all" | "judged" | "evaluating" | "flagged";

export default function HackathonPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: hackathon, isLoading, error } = useHackathon(id);
  const { data: projects = [], isLoading: loadingProjects, error: projectsError, refetch } = useLeaderboard(id);
  const update = useUpdateHackathon(id);
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [addOpen, setAddOpen] = useState(false);

  const evaluating = projects.filter(isEvaluating).length;
  const ranked = projects.filter((p) => p.overall_score !== null);

  if (error) {
    return (
      <Shell>
        <EmptyState icon={Trophy} title="Hackathon not found" description={(error as Error).message} action={<Link href="/dashboard" className="btn">Back to hackathons</Link>} />
      </Shell>
    );
  }

  const canSubmit = hackathon?.phase === "open" || hackathon?.phase === "upcoming";

  return (
    <Shell>
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold mb-5 hover:underline">
        <ArrowLeft size={15} /> All hackathons
      </Link>

      {isLoading || !hackathon ? (
        <div className="brutal-card p-6 space-y-3 mb-8">
          <div className="h-8 w-1/2 skeleton" />
          <div className="h-4 w-3/4 skeleton" />
          <div className="h-12 w-full skeleton" />
        </div>
      ) : (
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="brutal-card p-6 sm:p-8 mb-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 size-40 rounded-full border-2 border-ink bg-yellow hidden sm:block" aria-hidden />
          <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <PhaseBadge phase={hackathon.phase} />
                {hackathon.deadline && (
                  <span className="chip bg-card">
                    <CalendarClock size={12} aria-hidden /> {formatDate(hackathon.deadline, true)} · {timeUntil(hackathon.deadline)}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{hackathon.name}</h1>
              {hackathon.description && <p className="text-muted-foreground leading-relaxed">{hackathon.description}</p>}
              <div className="flex flex-wrap gap-4 mt-4">
                <TagGroup label="Themes" tags={splitList(hackathon.theme)} />
                <TagGroup label="Expected tech" tags={splitList(hackathon.technologies)} />
              </div>
            </div>
            <div className="flex flex-row flex-wrap lg:flex-col gap-2 shrink-0 relative lg:w-60">
              <button className="btn btn-primary" onClick={() => setAddOpen(true)} disabled={!canSubmit}>
                <Plus size={16} /> Submit project
              </button>
              {!hackathon.is_demo && (
                <button
                  className="btn"
                  disabled={update.isPending}
                  onClick={() =>
                    update.mutate(
                      { isAllowed: !hackathon.isAllowed },
                      {
                        onSuccess: () => toast.success(hackathon.isAllowed ? "Submissions closed" : "Submissions opened"),
                        onError: (e) => toast.error((e as Error).message),
                      },
                    )
                  }
                >
                  {hackathon.isAllowed ? <Lock size={16} /> : <LockOpen size={16} />}
                  {hackathon.isAllowed ? "Close submissions" : "Open submissions"}
                </button>
              )}
              <HeaderStats stats={hackathon.stats} />
            </div>
          </div>
          <CriteriaWeights criteria={hackathon.criteria_config} />
        </motion.section>
      )}

      {hackathon?.is_demo && !hackathon.isAllowed && <ShowcaseBanner />}

      <AnimatePresence>
        {evaluating > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border-2 border-ink bg-sky px-4 py-3 mb-6 font-semibold text-sm" role="status">
              <span className="size-2 rounded-full bg-ink animate-pulse-dot" aria-hidden />
              The jury is evaluating {evaluating} submission{evaluating > 1 ? "s" : ""} — the ranking updates live.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div role="tablist" aria-label="View" className="inline-flex rounded-full border-2 border-ink bg-card p-1 shadow-[var(--shadow-hard-sm)]">
          {(["leaderboard", "submissions"] as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className="relative px-4 py-1.5 text-sm font-semibold rounded-full capitalize"
            >
              {tab === t && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative" style={{ color: tab === t ? "var(--paper)" : undefined }}>
                {t} {t === "submissions" && <span className="num opacity-70">({projects.length})</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      {projectsError && <ErrorBanner message={(projectsError as Error).message} onRetry={() => refetch()} />}

      {loadingProjects ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 skeleton" />)}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No submissions yet"
          description={canSubmit ? "Submit the first project — the jury starts judging within seconds." : "Open submissions to start receiving projects."}
          action={canSubmit ? <button className="btn btn-primary" onClick={() => setAddOpen(true)}><Plus size={16} /> Submit a project</button> : undefined}
        />
      ) : tab === "leaderboard" ? (
        <div className="space-y-10">
          {ranked.length > 0 && <Podium projects={projects} />}
          <LeaderboardTable projects={projects} criteria={hackathon?.criteria_config ?? []} />
        </div>
      ) : (
        <Submissions projects={projects} />
      )}

      <AddProjectModal open={addOpen} onClose={() => setAddOpen(false)} hackathonId={id} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Topbar />
      <main id="main" className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}

function ShowcaseBanner() {
  const { data: hackathons = [] } = useHackathons();
  const sandbox = hackathons.find((h) => h.is_demo && h.isAllowed);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border-2 border-ink bg-violet/40 px-4 py-3 mb-6 text-sm">
      <p>
        <strong>This is the Evalio showcase.</strong> Real public repositories, cloned, measured and judged to show how the
        jury works. Open any project to read its full report.
      </p>
      {sandbox && (
        <Link href={`/hackathon/${sandbox.id}`} className="btn btn-sm btn-primary shrink-0">
          Try it in the Open Sandbox
        </Link>
      )}
    </div>
  );
}

function HeaderStats({ stats }: { stats: Hackathon["stats"] }) {
  const items: [string, string][] = [
    ["Submissions", String(stats.projects ?? 0)],
    ["Judged", String(stats.evaluated ?? 0)],
    ["Top score", formatScore(stats.top_score)],
    ["Average", formatScore(stats.avg_score)],
  ];
  return (
    <dl className="grid grid-cols-2 gap-2 w-full mt-1">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border-2 border-ink bg-card px-3 py-2">
          <dd className="num text-lg font-bold leading-tight">{value}</dd>
          <dt className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">{label}</dt>
        </div>
      ))}
    </dl>
  );
}

function TagGroup({ label, tags }: { label: string; tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div>
      <p className="eyebrow mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => <span key={t} className="chip">{t}</span>)}
      </div>
    </div>
  );
}

function CriteriaWeights({ criteria }: { criteria: Criterion[] }) {
  const total = criteria.reduce((s, c) => s + c.weight, 0) || 1;
  return (
    <div className="relative mt-6 pt-5 border-t-2 border-dashed border-ink/30">
      <p className="eyebrow mb-2">How projects are scored</p>
      <div className="flex h-9 rounded-lg border-2 border-ink overflow-hidden">
        {criteria.map((c, i) => (
          <motion.div
            key={c.name}
            className="h-full flex items-center justify-center text-xs font-bold px-2 border-r-2 border-ink last:border-r-0 overflow-hidden"
            style={{ background: JUDGE_COLORS[c.judge] }}
            initial={{ width: 0 }}
            animate={{ width: `${(c.weight / total) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            title={`${c.name} — ${Math.round((c.weight / total) * 100)}%`}
          >
            <span className="truncate">{c.name} <span className="num opacity-70">{Math.round((c.weight / total) * 100)}%</span></span>
          </motion.div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold">
        {(["code", "market", "product"] as const).map((j) => (
          <span key={j} className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full border-[1.5px] border-ink" style={{ background: JUDGE_COLORS[j] }} aria-hidden />
            {j === "code" ? "Code Judge" : j === "market" ? "Market Judge" : "Product Judge"}
          </span>
        ))}
      </div>
    </div>
  );
}

function Submissions({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return [...projects]
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
      .filter((p) =>
        filter === "all" ? true
          : filter === "judged" ? p.overall_score !== null && !isEvaluating(p)
          : filter === "evaluating" ? isEvaluating(p)
          : p.flags.some((f) => f.level !== "info"),
      )
      .filter((p) => !q || [p.name, p.short_description, p.long_description, p.github_link].some((v) => v?.toLowerCase().includes(q)));
  }, [projects, filter, query]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "judged", label: "Judged" },
    { key: "evaluating", label: "In progress" },
    { key: "flagged", label: "Flagged" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <label htmlFor="filter-q" className="sr-only">Filter submissions</label>
          <input id="filter-q" className="field pl-9" placeholder="Filter by name, description or repo…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`btn btn-sm ${filter === f.key ? "btn-dark" : ""}`} aria-pressed={filter === f.key}>
              {f.label}
            </button>
          ))}
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-10 text-center">No submissions match this filter.</p>
      ) : (
        <Stagger key={filter} className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <StaggerItem key={p.project_id}>
              <ProjectCard project={p} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
