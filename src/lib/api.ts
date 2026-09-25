import { API_BASE_URL } from "./constants";

// ============= Types =============

export type JudgeKey = "code" | "market" | "product";
export type StageKey = "ingest" | "code" | "market" | "product" | "verdict";
export type StageStatus = "pending" | "running" | "done" | "partial" | "failed" | "skipped";
export type ProjectStatus = "queued" | "running" | "completed" | "partial" | "failed" | "legacy";
export type HackathonPhase = "upcoming" | "open" | "closed" | "judging";

export interface Criterion {
  name: string;
  weight: number;
  judge: JudgeKey;
  description?: string;
}

export interface Evidence {
  file?: string;
  note?: string;
}

export interface CriterionScore extends Criterion {
  score: number | null;
  status?: "scored" | "heuristic" | "failed" | "no_code";
  rationale?: string;
  strengths?: string[];
  weaknesses?: string[];
  evidence?: Evidence[];
}

export interface Flag {
  level: "info" | "warning" | "error";
  code: string;
  message: string;
}

export interface PipelineStage {
  status: StageStatus;
  started_at?: string;
  finished_at?: string;
  message?: string;
}

export interface QAItem {
  question: string;
  answer: string;
}

export interface CodeReport {
  agent: "code";
  status: string;
  score: number | null;
  summary: string;
  architecture?: string;
  strengths?: string[];
  weaknesses?: string[];
  risks?: string[];
  evidence?: Evidence[];
  scorecard?: { score: number; subscores: Record<string, number> };
  files_reviewed?: string[];
  criteria: CriterionScore[];
  error?: string | null;
}

export interface Source {
  id: number;
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

export interface MarketReport {
  agent: "market";
  status: string;
  score: number | null;
  summary: string;
  profile?: { pitch: string; problem: string; solution?: string; category: string; target_users: string[] };
  audience?: { name: string; need: string }[];
  problem_severity?: string;
  market_size?: string;
  market_trend?: string;
  competitors?: { name: string; description: string; differentiation: string; url: string | null }[];
  differentiation?: string;
  business?: {
    business_model: string;
    revenue_streams: string[];
    go_to_market: string[];
    risks: { risk: string; severity: string; mitigation: string }[];
    opportunities: string[];
    verdict: string;
  } | null;
  scores?: { market_potential: number; differentiation: number; viability: number } | null;
  sources?: Source[];
  criteria: CriterionScore[];
  error?: string | null;
}

export interface ClaimCheck {
  claim: string;
  status: "implemented" | "partial" | "not_found";
  file?: string;
  note?: string;
}

export interface ProductReport {
  agent: "product";
  status: string;
  score: number | null;
  summary: string;
  scores?: { innovation?: number; theme_fit?: number; user_experience?: number; completeness?: number | null };
  rationales?: { innovation?: string; theme_fit?: string; user_experience?: string };
  wow_factor?: string;
  suggestions?: string[];
  claims?: ClaimCheck[];
  demo?: { url: string; reachable: boolean; status_code?: number; title?: string | null; detail?: string } | null;
  similar_submissions?: { project_id: string; name: string; similarity: number }[];
  criteria: CriterionScore[];
  error?: string | null;
}

export interface Verdict {
  score: number | null;
  headline: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  judge_scores: Partial<Record<JudgeKey, number | null>>;
  criteria: CriterionScore[];
  flags: Flag[];
  demo?: boolean;
}

export interface RepoSnapshot {
  repo: { url: string; owner: string; name: string; branch: string; commit: string };
  files: { tracked: number; analyzed: number; code_files: number; code_loc: number };
  languages: { name: string; loc: number; files: number; share: number }[];
  stack: { frameworks: { id: string; label: string }[]; libraries: string[] };
  signals: Record<string, unknown>;
  history: {
    commit_count: number;
    truncated?: boolean;
    first_commit_at?: string | null;
    last_commit_at?: string | null;
    contributors: { name: string; commits: number }[];
    commits_per_day?: Record<string, number>;
    recent_commits?: { sha: string; author: string; date: string; subject: string }[];
  };
  largest_files: { path: string; loc: number }[];
  indexed_chunks: number;
}

export interface Project {
  _id?: string;
  project_id: string;
  hackathon_id?: number | null;
  name: string;
  short_description: string;
  long_description?: string;
  github_link: string;
  demo_link?: string | null;
  theme?: string;
  project_type?: string;
  is_reviewed?: boolean;
  status: ProjectStatus;
  pipeline: Partial<Record<StageKey, PipelineStage>>;
  overall_score: number | null;
  judge_scores: Partial<Record<JudgeKey, number | null>>;
  headline?: string;
  flags: Flag[];
  criteria_scores: CriterionScore[];
  rank?: number | null;
  ranked_total?: number | null;
  queue_position?: number | null;
  last_error?: string | null;
  created_at?: string;
  evaluated_at?: string | null;
  // full report only
  verdict?: Verdict | null;
  code_agent_analysis?: CodeReport | QAItem[] | null;
  market_agent_analysis?: MarketReport | QAItem[] | null;
  product_agent_analysis?: ProductReport | null;
  repo_snapshot?: RepoSnapshot | null;
  score_explanation?: string;
}

export interface HackathonStats {
  projects?: number;
  evaluated?: number;
  in_progress?: number;
  top_score?: number | null;
  avg_score?: number | null;
}

export interface Hackathon {
  _id: string;
  id: number;
  name: string;
  description: string;
  theme: string;
  technologies: string;
  criteria: string;
  criteria_config: Criterion[];
  is_allowed: boolean;
  isAllowed: boolean;
  phase: HackathonPhase;
  is_demo?: boolean;
  starts_at: string | null;
  deadline: string | null;
  created_at: string | null;
  stats: HackathonStats;
}

export interface CreateProjectInput {
  name?: string;
  shortDescription: string;
  longDescription?: string;
  githubLink: string;
  demoLink?: string;
  hackathonId?: number | string;
  projectType?: string;
}

export interface CreateHackathonInput {
  name: string;
  description?: string;
  technologies?: string;
  theme?: string;
  criteria?: { name: string; weight: number }[];
  startsAt?: string;
  deadline?: string;
  isAllowed: boolean;
}

export type UpdateHackathonInput = Partial<CreateHackathonInput>;

export interface ChatTurn {
  input: string;
  output: string;
}

export interface ChatResponse {
  answer: string;
  sources?: { path: string; start_line: number; end_line: number }[];
  chathistory: ChatTurn[];
}

export interface SearchResult {
  project: Project;
  score: number | null;
}

// ============= HTTP helper =============

const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function http<T>(path: string, init?: RequestInit & { timeout?: number }): Promise<T> {
  const timeout = init?.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = `${res.status} ${res.statusText}`;
      try {
        const body = await res.json();
        if (typeof body?.detail === "string") detail = body.detail;
        else if (Array.isArray(body?.detail)) detail = body.detail.map((d: { msg?: string }) => d.msg).join("; ");
      } catch {
        // non-JSON error body
      }
      throw new ApiError(detail, res.status);
    }

    const text = await res.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(`The server took longer than ${Math.round(timeout / 1000)}s to answer`, 408);
    }
    if (err instanceof TypeError) {
      throw new ApiError("Can't reach the Evalio API — is the backend running?", 0);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

const post = (body: unknown, timeout?: number) => ({ method: "POST", body: JSON.stringify(body), timeout });

// ============= API surface =============

export const api = {
  // Hackathons
  getAllHackathons: () => http<{ hackathons: Hackathon[] }>("/get-all-hackathons"),
  getHackathon: (id: number | string) => http<{ hackathon: Hackathon }>(`/get-hackathon/${id}`),
  createHackathon: (input: CreateHackathonInput) =>
    http<{ message: string; hackathon_id: number }>("/create-hackathon", post(input)),
  updateHackathon: (id: number | string, input: UpdateHackathonInput) =>
    http<{ hackathon: Hackathon }>(`/update-hackathon/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  getHackathonProjects: (id: number | string) => http<{ projects: Project[] }>(`/get-hackathon-projects/${id}`),
  getLeaderboard: (id: number | string) =>
    http<{ hackathon: Hackathon; leaderboard: Project[] }>(`/get-hackathon-leaderboard/${id}`),

  // Projects
  getAllProjects: () => http<{ projects: Project[] }>("/get-all"),
  getProject: (id: string) => http<{ project: Project }>(`/get-project/${id}`),
  createProject: (input: CreateProjectInput) =>
    http<{ message: string; project_id: string }>("/create-project", post(input)),
  reevaluate: (id: string) => http<{ message: string; job_id: number }>(`/reevaluate/${id}`, { method: "POST" }),
  deleteProject: (id: string) => http<{ message: string }>(`/delete-project/${id}`, { method: "DELETE" }),
  reviewProject: (project_id: string, isReviewed: boolean) =>
    http<{ message: string }>("/review", post({ project_id, isReviewed })),

  // Chat & search
  chat: (input: { project_id?: string; question: string; chathistory: ChatTurn[] }) =>
    http<ChatResponse>(input.project_id ? "/chat-agent" : "/chat-agent/simple", post(input, 90_000)),
  search: (query: string, hackathonId?: number | string) =>
    http<{ results: SearchResult[] }>("/search", post({ query, hackathonId }, 30_000)),
};

// ============= Helpers =============

export const JUDGES: { key: JudgeKey; label: string; short: string }[] = [
  { key: "code", label: "Code Judge", short: "Code" },
  { key: "market", label: "Market Judge", short: "Market" },
  { key: "product", label: "Product Judge", short: "Product" },
];

export function isEvaluating(p: Pick<Project, "status">): boolean {
  return p.status === "queued" || p.status === "running";
}

export function isLegacyReport<T>(report: T | QAItem[] | null | undefined): report is QAItem[] {
  return Array.isArray(report);
}

export function splitList(value?: string | null): string[] {
  return (value ?? "").split(",").map((t) => t.trim()).filter(Boolean);
}
