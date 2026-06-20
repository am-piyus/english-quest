import type { UserProfile } from "@/lib/userProfile";

export default function UserProfileCard({ profile }: { profile: UserProfile }) {
  const first = profile.fullName.split(" ")[0];

  return (
    <section className="eq-card flex items-center gap-4 p-5">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand text-2xl font-bold text-white">
        {first.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-ink-soft">Welcome back,</p>
        <h1 className="truncate text-2xl font-extrabold text-ink">{first} 👋</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="eq-chip">{profile.level}</span>
          <span className="eq-chip">🎯 {profile.goal}</span>
          <span className="eq-chip">⏱ {profile.dailyTargetMinutes} min/day</span>
        </div>
      </div>
    </section>
  );
}
