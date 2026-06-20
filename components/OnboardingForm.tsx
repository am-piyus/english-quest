"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveProfile,
  type DailyTarget,
  type LearningGoal,
  type LearningLevel,
  type UserProfile,
} from "@/lib/userProfile";
import { useProfile } from "@/lib/useProfile";
import type { Session } from "@/lib/session";

const LEVELS: { value: LearningLevel; hint: string }[] = [
  { value: "Beginner", hint: "Just starting out" },
  { value: "Intermediate", hint: "I know the basics" },
  { value: "Advanced", hint: "Polishing my skills" },
];

const GOALS: { value: LearningGoal; icon: string }[] = [
  { value: "Speaking", icon: "🗣️" },
  { value: "Grammar", icon: "📐" },
  { value: "Writing", icon: "✍️" },
  { value: "Mixed Learning", icon: "🎯" },
];

const TARGETS: DailyTarget[] = [10, 20, 30, 45];

function Option({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ring-1 transition-colors ${
        selected
          ? "bg-brand text-white ring-brand"
          : "bg-white text-ink ring-black/10 hover:bg-brand-soft"
      }`}
    >
      {children}
    </button>
  );
}

export default function OnboardingForm({ session }: { session: Session }) {
  const router = useRouter();
  const email = session.email;
  const profile = useProfile(email);

  const [fullName, setFullName] = useState(
    session.name && session.name !== "Demo Learner" ? session.name : "",
  );
  const [level, setLevel] = useState<LearningLevel>("Beginner");
  const [goal, setGoal] = useState<LearningGoal>("Mixed Learning");
  const [target, setTarget] = useState<DailyTarget>(20);
  const [saving, setSaving] = useState(false);

  // Already onboarded on this device? Skip straight to the dashboard.
  useEffect(() => {
    if (profile) router.replace("/dashboard");
  }, [profile, router]);

  // undefined = still reading; a profile = redirecting → render nothing.
  if (profile === undefined || profile) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const newProfile: UserProfile = {
      fullName: fullName.trim() || "Learner",
      level,
      goal,
      dailyTargetMinutes: target,
      createdAt: new Date().toISOString(),
    };
    saveProfile(email, newProfile);
    router.push("/dashboard");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="eq-card w-full max-w-lg space-y-7 p-7 sm:p-8"
    >
      <div>
        <span className="eq-chip mb-3">🎉 Welcome aboard</span>
        <h1 className="text-2xl font-bold text-ink">Let&apos;s set up your quest</h1>
        <p className="mt-1 text-sm text-ink-soft">
          A few quick choices so we can tailor your daily lessons.
        </p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="fullName" className="block text-sm font-semibold text-ink">
          What should we call you?
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-2xl bg-white px-4 py-3 text-ink ring-1 ring-black/10 outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* Level */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">Your level</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <Option
              key={l.value}
              selected={level === l.value}
              onClick={() => setLevel(l.value)}
            >
              <span className="block">{l.value}</span>
              <span className="block text-xs font-normal opacity-80">{l.hint}</span>
            </Option>
          ))}
        </div>
      </fieldset>

      {/* Goal */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">Main goal</legend>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map((g) => (
            <Option
              key={g.value}
              selected={goal === g.value}
              onClick={() => setGoal(g.value)}
            >
              <span aria-hidden className="mr-1">
                {g.icon}
              </span>
              {g.value}
            </Option>
          ))}
        </div>
      </fieldset>

      {/* Daily target */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-ink">Daily study target</legend>
        <div className="grid grid-cols-4 gap-2">
          {TARGETS.map((t) => (
            <Option key={t} selected={target === t} onClick={() => setTarget(t)}>
              <span className="block text-center">{t}</span>
              <span className="block text-center text-xs font-normal opacity-80">
                min
              </span>
            </Option>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={saving} className="eq-btn eq-btn-primary w-full">
        {saving ? "Saving…" : "Start my first quest →"}
      </button>
    </form>
  );
}
