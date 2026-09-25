"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarClock, Users } from "lucide-react";
import { splitList, type Hackathon } from "@/lib/api";
import { ACCENT_COLORS } from "@/lib/constants";
import { formatScore, timeUntil } from "@/lib/utils";
import { PhaseBadge } from "./status";

export function HackathonCard({ hackathon, index }: { hackathon: Hackathon; index: number }) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const themes = splitList(hackathon.theme);
  const { projects = 0, evaluated = 0, in_progress = 0, top_score } = hackathon.stats ?? {};
  const progress = projects ? evaluated / projects : 0;

  return (
    <Link
      href={`/hackathon/${hackathon.id}`}
      className="group block brutal-card brutal-lift overflow-hidden h-full focus-visible:outline-offset-4"
    >
      <div className="relative h-24 border-b-2 border-ink overflow-hidden" style={{ background: accent }}>
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "repeating-linear-gradient(-45deg, var(--ink) 0 2px, transparent 2px 14px)" }}
          aria-hidden
        />
        <div className="absolute left-4 bottom-3 right-4 flex items-end justify-between gap-2">
          <span className="flex flex-wrap gap-1.5">
            <PhaseBadge phase={hackathon.phase} />
            {hackathon.is_demo && <span className="chip bg-card">Example</span>}
          </span>
          <span className="size-9 rounded-full border-2 border-ink bg-card flex items-center justify-center transition-transform duration-200 group-hover:rotate-45">
            <ArrowUpRight size={18} aria-hidden />
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-3">
        <h3 className="text-lg font-bold leading-snug">{hackathon.name}</h3>
        {hackathon.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{hackathon.description}</p>
        )}
        {themes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {themes.slice(0, 3).map((t) => (
              <span key={t} className="chip">{t}</span>
            ))}
            {themes.length > 3 && <span className="chip bg-muted">+{themes.length - 3}</span>}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-3 border-t-2 border-dashed border-ink/30">
          <Stat label="Projects" value={String(projects)} icon={<Users size={13} aria-hidden />} />
          <Stat label="Judged" value={`${Math.round(progress * 100)}%`} />
          <Stat label="Top score" value={formatScore(top_score)} />
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarClock size={13} aria-hidden />
            {hackathon.deadline ? timeUntil(hackathon.deadline) : "No deadline"}
          </span>
          {in_progress > 0 && (
            <span className="flex items-center gap-1.5 font-semibold text-ink">
              <span className="size-1.5 rounded-full bg-ink animate-pulse-dot" aria-hidden />
              {in_progress} being judged
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="num text-lg font-bold flex items-center gap-1">{icon}{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
    </div>
  );
}
