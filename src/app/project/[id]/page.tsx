"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCheck, Code2, ExternalLink, FileSearch, Gavel, GitBranch, LineChart, RefreshCw, Sparkles, Trash2,
} from "lucide-react";
import { Topbar } from "@/components/Topbar";
import { ChatInterface } from "@/components/ChatInterface";
import { PipelineTracker } from "@/components/PipelineTracker";
import { QAAccordion } from "@/components/QAAccordion";
import { EmptyState } from "@/components/EmptyState";
import { Modal } from "@/components/Modal";
import { ScoreDial } from "@/components/score";
import { FlagList, StatusPill } from "@/components/status";
import { CriteriaBreakdown, Points } from "@/components/report/CriteriaBreakdown";
import { CodePanel, MarketPanel, ProductPanel } from "@/components/report/JudgePanels";
import { useProject, useReevaluate } from "@/lib/hooks/useProject";
import { api, isEvaluating, isLegacyReport, JUDGES, type CodeReport, type JudgeKey, type MarketReport, type Project } from "@/lib/api";
import { JUDGE_COLORS } from "@/lib/constants";
import { formatDate, formatScore, repoLabel } from "@/lib/utils";

const JUDGE_ICONS = { code: Code2, market: LineChart, product: Sparkles } as const;

export default function ProjectPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: project, isLoading, error } = useProject(id);

  return (
    <div className="min-h-dvh">
      <Topbar />
      <main id="main" className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        {isLoading ? (
          <ReportSkeleton />
        ) : error || !project ? (
          <EmptyState
            icon={FileSearch}
            title="Project not found"
            description={(error as Error)?.message ?? "This submission doesn't exist or was deleted."}
            action={<Link href="/dashboard" className="btn">Back to hackathons</Link>}
          />
        ) : (
          <Report project={project} />
        )}
      </main>
    </div>
  );
}

function Report({ project }: { project: Project }) {
  const evaluating = isEvaluating(project);
  const verdict = project.verdict;
  const repoUrl = project.github_link?.replace(/\.git$/, "");
  const legacy = project.status === "legacy" || isLegacyReport(project.code_agent_analysis) || isLegacyReport(project.market_agent_analysis);
  const criteria = verdict?.criteria?.length ? verdict.criteria : project.criteria_scores;

  return (
    <>
      <Header project={project} />

      {verdict?.demo && (
        <div className="rounded-xl border-2 border-ink bg-violet/40 px-4 py-3 mb-8 text-sm">
          <strong>Example evaluation from the Evalio showcase.</strong> Built from this repository&apos;s real measurements,
          source code and live web research; the scorecard, weighted score and integrity flags are computed by the jury.
          Re-run the jury to replace it with a fresh evaluation.
        </div>
      )}

      <AnimatePresence mode="popLayout">
        {evaluating && (
          <motion.div key="tracker" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="mb-8">
            <PipelineTracker project={project} />
          </motion.div>
        )}
      </AnimatePresence>

      {legacy && !evaluating && <LegacyNotice project={project} />}

      {project.status === "failed" && !evaluating && (
        <div className="rounded-xl border-2 border-ink bg-coral/40 p-4 mb-8 text-sm" role="alert">
          <strong>The evaluation failed.</strong> {project.last_error ?? "Try running the jury again."}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        <div className="space-y-10 min-w-0">
          {(verdict || project.overall_score !== null) && !legacy && (
            <VerdictHero project={project} />
          )}

          {project.flags?.length > 0 && (
            <section aria-labelledby="flags-title">
              <h2 id="flags-title" className="text-xl font-bold mb-3">Integrity & rule checks</h2>
              <FlagList flags={project.flags} />
            </section>
          )}

          {criteria.length > 0 && !legacy && (
            <section aria-labelledby="criteria-title">
              <div className="flex items-end justify-between mb-3">
                <h2 id="criteria-title" className="text-xl font-bold">Scorecard</h2>
                <span className="text-xs text-muted-foreground">Final score = weighted average of these criteria</span>
              </div>
              <CriteriaBreakdown criteria={criteria} repoUrl={repoUrl} />
            </section>
          )}

          {!legacy && <JudgeTabs project={project} repoUrl={repoUrl} />}
        </div>

        {/* Fills the viewport height on desktop so there is never a dead area beside the report */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100dvh-6rem)] flex flex-col gap-4">
          <ChatInterface projectId={project.project_id} repoUrl={repoUrl} className="lg:flex-1 lg:min-h-0" />
          <ProjectFacts project={project} />
        </aside>
      </div>
    </>
  );
}

function Header({ project }: { project: Project }) {
  const qc = useQueryClient();
  const router = useRouter();
  const reevaluate = useReevaluate(project.project_id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const review = useMutation({
    mutationFn: () => api.reviewProject(project.project_id, !project.is_reviewed),
    onSuccess: () => {
      toast.success(project.is_reviewed ? "Marked as not reviewed" : "Marked as reviewed by a human judge");
      qc.invalidateQueries({ queryKey: ["project", project.project_id] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: () => api.deleteProject(project.project_id),
    onSuccess: () => {
      toast.success("Submission deleted");
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      router.push(project.hackathon_id ? `/hackathon/${project.hackathon_id}` : "/dashboard");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="mb-8">
      <Link
        href={project.hackathon_id ? `/hackathon/${project.hackathon_id}` : "/dashboard"}
        className="inline-flex items-center gap-1.5 text-sm font-semibold mb-5 hover:underline"
      >
        <ArrowLeft size={15} /> Back to the leaderboard
      </Link>
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusPill status={project.status} />
            {project.rank && (
              <span className="chip bg-yellow num">
                Rank #{project.rank}{project.ranked_total ? ` of ${project.ranked_total}` : ""}
              </span>
            )}
            {project.is_reviewed && <span className="chip bg-mint"><CheckCheck size={12} /> Human-reviewed</span>}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{project.name}</h1>
          <p className="text-lg text-muted-foreground mt-1">{project.short_description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <a href={project.github_link} target="_blank" rel="noreferrer" className="chip hover:bg-yellow">
              <GitBranch size={12} aria-hidden /> {repoLabel(project.github_link)}
            </a>
            {project.demo_link && (
              <a href={project.demo_link} target="_blank" rel="noreferrer" className="chip hover:bg-yellow">
                <ExternalLink size={12} aria-hidden /> Live demo
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            className="btn"
            disabled={reevaluate.isPending || isEvaluating(project)}
            onClick={() =>
              reevaluate.mutate(undefined, {
                onSuccess: () => toast.success("The jury will review this project again"),
                onError: (e) => toast.error((e as Error).message),
              })
            }
          >
            <RefreshCw size={16} className={isEvaluating(project) ? "animate-spin-slow" : ""} />
            {isEvaluating(project) ? "Judging…" : "Re-run jury"}
          </button>
          <button className={`btn ${project.is_reviewed ? "" : "btn-primary"}`} disabled={review.isPending} onClick={() => review.mutate()}>
            <CheckCheck size={16} /> {project.is_reviewed ? "Unmark review" : "Mark reviewed"}
          </button>
          {!project.verdict?.demo && (
            <button className="btn" onClick={() => setConfirmDelete(true)} aria-label="Delete submission">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this submission?" subtitle="Its scores, reports and code index are removed permanently.">
        <div className="flex justify-end gap-2">
          <button className="btn" onClick={() => setConfirmDelete(false)}>Cancel</button>
          <button className="btn btn-danger" disabled={remove.isPending} onClick={() => remove.mutate()}>
            <Trash2 size={16} /> {remove.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function VerdictHero({ project }: { project: Project }) {
  const verdict = project.verdict;
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="brutal-card p-6 sm:p-8 relative overflow-hidden"
      aria-labelledby="verdict-title"
    >
      <div className="absolute inset-y-0 right-0 w-1/3 opacity-[0.06] hidden md:block" style={{ backgroundImage: "repeating-linear-gradient(45deg, var(--ink) 0 2px, transparent 2px 12px)" }} aria-hidden />
      <div className="relative flex flex-col md:flex-row gap-8 items-center md:items-start">
        <ScoreDial score={project.overall_score} />
        <div className="flex-1 min-w-0">
          <p className="eyebrow flex items-center gap-1.5 mb-2"><Gavel size={13} aria-hidden /> Head judge verdict</p>
          <h2 id="verdict-title" className="text-2xl font-bold leading-tight mb-2">{verdict?.headline || project.headline || "Verdict pending"}</h2>
          {verdict?.summary && <p className="leading-relaxed text-muted-foreground">{verdict.summary}</p>}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {JUDGES.map((j, i) => (
              <JudgeScoreCard key={j.key} judge={j.key} label={j.label} score={project.judge_scores?.[j.key]} delay={0.3 + i * 0.1} />
            ))}
          </div>
        </div>
      </div>
      {verdict && (verdict.strengths?.length > 0 || verdict.improvements?.length > 0) && (
        <div className="relative grid gap-3 sm:grid-cols-2 mt-6">
          <Points title="Why it scores" items={verdict.strengths} tone="var(--mint)" />
          <Points title="What to improve" items={verdict.improvements} tone="var(--coral)" />
        </div>
      )}
    </motion.section>
  );
}

function JudgeScoreCard({ judge, label, score, delay }: { judge: JudgeKey; label: string; score?: number | null; delay: number }) {
  const Icon = JUDGE_ICONS[judge];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-xl border-2 border-ink p-3 shadow-[var(--shadow-hard-sm)]"
      style={{ background: JUDGE_COLORS[judge] }}
    >
      <Icon size={16} aria-hidden />
      <div className="num text-2xl font-bold mt-1">{formatScore(score)}</div>
      <div className="text-xs font-semibold leading-tight">{label}</div>
    </motion.div>
  );
}

function JudgeTabs({ project, repoUrl }: { project: Project; repoUrl?: string }) {
  const [tab, setTab] = useState<JudgeKey>("code");
  const code = project.code_agent_analysis as CodeReport | null | undefined;
  const market = project.market_agent_analysis as MarketReport | null | undefined;

  return (
    <section aria-labelledby="reports-title">
      <h2 id="reports-title" className="text-xl font-bold mb-3">Judges&apos; reports</h2>
      <div role="tablist" aria-label="Judge reports" className="flex flex-wrap gap-2 mb-4">
        {JUDGES.map((j) => {
          const Icon = JUDGE_ICONS[j.key];
          const active = tab === j.key;
          return (
            <button
              key={j.key}
              role="tab"
              id={`tab-${j.key}`}
              aria-selected={active}
              aria-controls={`panel-${j.key}`}
              onClick={() => setTab(j.key)}
              className="btn"
              style={{ background: active ? JUDGE_COLORS[j.key] : undefined, boxShadow: active ? "var(--shadow-hard)" : undefined, transform: active ? "translate(-1px,-1px)" : undefined }}
            >
              <Icon size={16} aria-hidden /> {j.label}
              <span className="num opacity-70">{formatScore(project.judge_scores?.[j.key])}</span>
            </button>
          );
        })}
      </div>
      {/* Enter-only animation: an exit phase would collapse the page and jump the scroll position */}
      <motion.div
        key={tab}
        id={`panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-2xl border-2 border-ink p-4 sm:p-6"
        style={{ background: `color-mix(in srgb, ${JUDGE_COLORS[tab]} 14%, var(--paper))` }}
      >
        {tab === "code" && <CodePanel report={code} snapshot={project.repo_snapshot} repoUrl={repoUrl} />}
        {tab === "market" && <MarketPanel report={market} />}
        {tab === "product" && <ProductPanel report={project.product_agent_analysis} repoUrl={repoUrl} />}
      </motion.div>
    </section>
  );
}

function ProjectFacts({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false);
  const snap = project.repo_snapshot;
  const stack = snap ? [...snap.stack.frameworks.map((f) => f.label), ...snap.stack.libraries].slice(0, 6) : [];
  const langs = snap?.languages.slice(0, 5) ?? [];
  const LANG_COLORS = ["var(--sky)", "var(--yellow)", "var(--mint)", "var(--coral)", "var(--violet)"];

  return (
    <div className="brutal-card p-4 text-sm space-y-3 shrink-0">
      <p className="eyebrow">At a glance</p>
      {project.long_description && (
        <div>
          <p className={`leading-relaxed whitespace-pre-line ${expanded ? "" : "line-clamp-3"}`}>{project.long_description}</p>
          {project.long_description.length > 160 && (
            <button className="text-xs font-semibold underline mt-1" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Show less" : "Read the team's description"}
            </button>
          )}
        </div>
      )}

      {snap && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ["LOC", snap.files.code_loc.toLocaleString("en-US")],
              ["Commits", `${snap.history.commit_count}${snap.history.truncated ? "+" : ""}`],
              ["People", snap.history.contributors.length],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg border-2 border-ink bg-muted/60 py-1.5">
                <div className="num font-bold">{value}</div>
                <div className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
          {langs.length > 0 && (
            <div className="flex h-2.5 rounded-full border-2 border-ink overflow-hidden" title={langs.map((l) => `${l.name} ${Math.round(l.share * 100)}%`).join(" · ")}>
              {langs.map((l, i) => (
                <span key={l.name} style={{ width: `${l.share * 100}%`, background: LANG_COLORS[i] }} className="h-full" />
              ))}
            </div>
          )}
          {stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {stack.map((s) => <span key={s} className="chip text-[11px]">{s}</span>)}
            </div>
          )}
        </>
      )}

      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs pt-2 border-t-2 border-dashed border-ink/30">
        <dt className="text-muted-foreground">Submitted</dt>
        <dd className="font-semibold text-right">{formatDate(project.created_at, true)}</dd>
        <dt className="text-muted-foreground">Last judged</dt>
        <dd className="font-semibold text-right">{formatDate(project.evaluated_at, true)}</dd>
        <dt className="text-muted-foreground">Declared stack</dt>
        <dd className="font-semibold text-right">{(project.project_type ?? "OTHER").replace(/_/g, " ").toLowerCase()}</dd>
      </dl>
    </div>
  );
}

function LegacyNotice({ project }: { project: Project }) {
  const reevaluate = useReevaluate(project.project_id);
  const code = project.code_agent_analysis;
  const market = project.market_agent_analysis;
  return (
    <section className="brutal-card p-6 mb-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">This project was judged by the previous version of Evalio</h2>
          <p className="text-muted-foreground text-sm">Re-run the jury to get code evidence, cited market research, claim checks and a weighted ranking.</p>
        </div>
        <button className="btn btn-primary shrink-0" disabled={reevaluate.isPending} onClick={() => reevaluate.mutate(undefined, { onSuccess: () => toast.success("Re-evaluation queued") })}>
          <RefreshCw size={16} /> Re-run jury
        </button>
      </div>
      {isLegacyReport(market) && market.length > 0 && (<div><p className="eyebrow mb-2">Old market answers</p><QAAccordion items={market} /></div>)}
      {isLegacyReport(code) && code.length > 0 && (<div><p className="eyebrow mb-2">Old code answers</p><QAAccordion items={code} /></div>)}
    </section>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-1/2 skeleton" />
      <div className="h-5 w-1/3 skeleton" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="brutal-card p-8 flex gap-8">
          <div className="size-40 rounded-full skeleton shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-6 w-3/4 skeleton" />
            <div className="h-4 w-full skeleton" />
            <div className="h-20 w-full skeleton" />
          </div>
        </div>
        <div className="h-80 skeleton" />
      </div>
    </div>
  );
}
