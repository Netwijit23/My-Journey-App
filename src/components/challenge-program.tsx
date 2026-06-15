"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Dumbbell,
  Plane,
  ShieldAlert,
  Utensils,
} from "lucide-react";

import programJson from "@/data/ai-fitness-program.json";
import {
  calculateDailyChallengeScore,
  challengeLogsToCsv,
  challengeStorageKey,
  challengeStreak,
  createEmptyDailyLog,
  downloadText,
  isChallengeDayComplete,
} from "@/lib/challenge";
import type {
  ChallengeCheckpointLog,
  ChallengeDailyLog,
  ChallengeProgram,
} from "@/types/forma";
import { cn } from "@/lib/utils";

const program = programJson as unknown as ChallengeProgram;

type ChallengeState = {
  selectedDay: number;
  disclaimerAccepted: boolean;
  logs: Record<number, ChallengeDailyLog>;
  checkpoints: Record<number, ChallengeCheckpointLog>;
};

const initialChallengeState: ChallengeState = {
  selectedDay: 1,
  disclaimerAccepted: false,
  logs: {},
  checkpoints: {},
};

export function ChallengeProgramSection() {
  const [state, setState] = useState<ChallengeState>(initialChallengeState);
  const selectedDay = program.days.find((day) => day.day === state.selectedDay) ?? program.days[0];
  const selectedLog = state.logs[selectedDay.day] ?? createEmptyDailyLog(selectedDay.day);
  const score = calculateDailyChallengeScore(selectedLog);
  const completedDays = program.days.filter((day) =>
    isChallengeDayComplete(state.logs[day.day] ?? createEmptyDailyLog(day.day)),
  ).length;
  const streak = challengeStreak(state.logs);
  const checkpoint = program.checkpoints[`day_${selectedDay.day}`];

  const scoreItems = useMemo(
    () => [
      { label: "Weight logged", value: Number(selectedLog.weightKg) > 0, points: 10 },
      { label: "Waist logged", value: Number(selectedLog.waistCm) > 0, points: 10 },
      { label: "Sleep 7.5+ hours", value: Number(selectedLog.sleepHours) >= 7.5, points: 15 },
      { label: "Steps 10,000+", value: Number(selectedLog.stepCount) >= 10000, points: 15 },
      { label: "Workout complete", value: selectedLog.workoutCompleted, points: 20 },
      { label: "Protein 220g+", value: Number(selectedLog.proteinG) >= 220, points: 20 },
      { label: "Water 3L+", value: Number(selectedLog.waterLiters) >= 3, points: 10 },
    ],
    [selectedLog],
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(challengeStorageKey);
    if (!saved) return;
    try {
      setState({ ...initialChallengeState, ...JSON.parse(saved) });
    } catch {
      window.localStorage.removeItem(challengeStorageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(challengeStorageKey, JSON.stringify(state));
  }, [state]);

  function updateLog(patch: Partial<ChallengeDailyLog>) {
    setState((current) => {
      const currentLog = current.logs[selectedDay.day] ?? createEmptyDailyLog(selectedDay.day);
      return {
        ...current,
        logs: {
          ...current.logs,
          [selectedDay.day]: {
            ...currentLog,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }

  function updateCheckpoint(patch: Partial<ChallengeCheckpointLog>) {
    setState((current) => {
      const currentLog = current.checkpoints[selectedDay.day] ?? {
        day: selectedDay.day,
        measurements: "",
        progress: "",
        adjustment: "",
      };
      return {
        ...current,
        checkpoints: {
          ...current.checkpoints,
          [selectedDay.day]: {
            ...currentLog,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  }

  function exportJson() {
    downloadText(
      "my-journey-ai-fitness-challenge-progress.json",
      JSON.stringify({ program: program.program_name, exportedAt: new Date().toISOString(), state }, null, 2),
      "application/json",
    );
  }

  function exportCsv() {
    downloadText(
      "my-journey-ai-fitness-challenge-progress.csv",
      challengeLogsToCsv(program.days, state.logs),
      "text/csv",
    );
  }

  return (
    <section id="challenge" className="panel scroll-mt-24 rounded-[30px] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">30-day program</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{program.program_name}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Follow each day, log your scorecard, adapt when life gets messy, and export the full progress record.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center sm:min-w-80">
          <Stat label="Completed" value={`${completedDays}/30`} />
          <Stat label="Streak" value={`${streak}`} />
          <Stat label="Today" value={`${score}/100`} />
        </div>
      </div>

      {!state.disclaimerAccepted && (
        <div className="mt-5 rounded-[24px] border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 text-amber-600" size={20} />
            <div>
              <p className="font-semibold">Safety disclaimer</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                This plan is for general fitness tracking and content documentation. Stop if pain, dizziness, or illness occurs and consult a qualified professional if needed.
              </p>
              <button
                onClick={() => setState((current) => ({ ...current, disclaimerAccepted: true }))}
                className="mt-3 h-10 rounded-full bg-black px-4 text-sm font-medium text-white dark:bg-white dark:text-black"
              >
                I understand
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {program.days.map((day) => {
          const dayScore = calculateDailyChallengeScore(state.logs[day.day] ?? createEmptyDailyLog(day.day));
          return (
            <button
              key={day.day}
              onClick={() => setState((current) => ({ ...current, selectedDay: day.day }))}
              className={cn(
                "h-16 min-w-16 rounded-2xl border border-[var(--hairline)] px-3 text-left text-sm",
                day.day === selectedDay.day && "bg-black text-white dark:bg-white dark:text-black",
              )}
            >
              <span className="block font-semibold">Day {day.day}</span>
              <span className="text-xs opacity-65">{dayScore}/100</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div className="rounded-[26px] bg-black p-5 text-white dark:bg-white dark:text-black">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm opacity-60">Day {selectedDay.day} · Week {selectedDay.week}</p>
                <h3 className="mt-1 text-3xl font-semibold">{selectedDay.type}</h3>
                <p className="mt-2 text-sm opacity-70">{selectedDay.cardio}</p>
              </div>
              <button
                onClick={() => updateLog({ workoutCompleted: !selectedLog.workoutCompleted })}
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-medium text-black dark:bg-black dark:text-white"
              >
                <CheckCircle2 size={16} />
                {selectedLog.workoutCompleted ? "Workout complete" : "Complete Workout"}
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <DarkMetric label="Calories" value={selectedDay.calories} unit="kcal" />
              <DarkMetric label="Protein" value={selectedDay.protein} unit="g" />
              <DarkMetric label="Carbs" value={selectedDay.carbs} unit="g" />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--hairline)] p-4">
              <SectionHeader icon={Dumbbell} title="Workout" />
              <div className="mt-4 space-y-2">
                {selectedDay.workout.map((row) => (
                  <div key={`${row[0]}-${row[1]}-${row[2]}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 rounded-2xl bg-black/[0.04] p-3 text-sm dark:bg-white/[0.06]">
                    <span className="font-medium">{row[0]}</span>
                    <span className="text-[var(--muted)]">{row[1]} sets</span>
                    <span className="text-[var(--muted)]">{row[2]}</span>
                    <span className="text-[var(--muted)]">{row[3]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--hairline)] p-4">
              <SectionHeader icon={Utensils} title="Nutrition and content" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Metric label="Fat" value={selectedDay.fat} unit="g" />
                <Metric label="Water" value={program.nutrition.targets.water_liters} unit="L" />
              </div>
              <div className="mt-4 rounded-2xl bg-black/[0.04] p-3 dark:bg-white/[0.06]">
                <p className="text-sm font-semibold">{selectedDay.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{selectedDay.hook}</p>
                <p className="mt-2 text-sm leading-5 text-[var(--muted)]">{selectedDay.angle}</p>
              </div>
            </div>
          </div>

          {checkpoint && (
            <CheckpointPanel
              day={selectedDay.day}
              checkpoint={checkpoint}
              log={state.checkpoints[selectedDay.day]}
              onChange={updateCheckpoint}
            />
          )}

          <AdaptationPanel mode={selectedLog.adaptationMode} onChange={(mode) => updateLog({ adaptationMode: mode })} />
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-[var(--hairline)] p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Daily scorecard</h3>
              <span className="rounded-full bg-black px-3 py-1 text-sm font-medium text-white dark:bg-white dark:text-black">
                {score}/100
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {scoreItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl bg-black/[0.04] p-3 text-sm dark:bg-white/[0.06]">
                  <span>{item.label}</span>
                  <span className={item.value ? "text-emerald-500" : "text-[var(--muted)]"}>
                    {item.value ? `+${item.points}` : `0/${item.points}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--hairline)] p-4">
            <h3 className="font-semibold">Daily tracking</h3>
            <div className="mt-4 grid gap-3">
              <Input label="Weight" unit="kg" value={selectedLog.weightKg} onChange={(value) => updateLog({ weightKg: value })} />
              <Input label="Waist" unit="cm" value={selectedLog.waistCm} onChange={(value) => updateLog({ waistCm: value })} />
              <Input label="Sleep" unit="hours" value={selectedLog.sleepHours} onChange={(value) => updateLog({ sleepHours: value })} />
              <Input label="Energy" unit="1-10" value={selectedLog.energyLevel} onChange={(value) => updateLog({ energyLevel: value })} />
              <Input label="Mood" unit="1-10" value={selectedLog.moodLevel} onChange={(value) => updateLog({ moodLevel: value })} />
              <Input label="Steps" unit="count" value={selectedLog.stepCount} onChange={(value) => updateLog({ stepCount: value })} />
              <Input label="Calories" unit="kcal" value={selectedLog.calories} onChange={(value) => updateLog({ calories: value })} />
              <Input label="Protein" unit="g" value={selectedLog.proteinG} onChange={(value) => updateLog({ proteinG: value })} />
              <Input label="Water" unit="L" value={selectedLog.waterLiters} onChange={(value) => updateLog({ waterLiters: value })} />
              <label className="block">
                <span className="text-xs text-[var(--muted)]">Notes</span>
                <textarea
                  value={selectedLog.notes}
                  onChange={(event) => updateLog({ notes: event.target.value })}
                  className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-[var(--hairline)] bg-transparent p-3 text-sm outline-none"
                />
              </label>
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--hairline)] p-4">
            <h3 className="font-semibold">Export progress</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={exportJson} className="flex h-11 items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white dark:bg-white dark:text-black">
                <Download size={16} />
                JSON
              </button>
              <button onClick={exportCsv} className="flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--hairline)] text-sm font-medium">
                <Download size={16} />
                CSV
              </button>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function AdaptationPanel({
  mode,
  onChange,
}: {
  mode: ChallengeDailyLog["adaptationMode"];
  onChange: (mode: ChallengeDailyLog["adaptationMode"]) => void;
}) {
  const options: Array<{ key: ChallengeDailyLog["adaptationMode"]; label: string }> = [
    { key: "none", label: "Standard plan" },
    { key: "missed_workout", label: "Missed workout" },
    { key: "travel_hotel_gym", label: "Travel/hotel gym" },
    { key: "no_gym", label: "No gym" },
    { key: "sick", label: "Sick/recovery" },
  ];
  const protocol = program.adaptation_protocol;

  return (
    <div className="rounded-[24px] border border-[var(--hairline)] p-4">
      <SectionHeader icon={Plane} title="Adaptation mode" />
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={cn(
              "h-10 min-w-fit rounded-full border border-[var(--hairline)] px-4 text-sm",
              mode === option.key && "bg-black text-white dark:bg-white dark:text-black",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {mode !== "none" && (
        <div className="mt-3 rounded-2xl bg-black/[0.04] p-3 text-sm leading-6 text-[var(--muted)] dark:bg-white/[0.06]">
          {mode === "missed_workout" && protocol.missed_workout.map((item) => <p key={item}>{item}</p>)}
          {mode === "travel_hotel_gym" && (
            <>
              <p>{protocol.travel_hotel_gym.instructions}</p>
              {protocol.travel_hotel_gym.workout.map((item) => <p key={item}>{item}</p>)}
            </>
          )}
          {mode === "no_gym" && (
            <>
              <p>{protocol.no_gym.instructions}</p>
              {protocol.no_gym.workout.map((item) => <p key={item}>{item}</p>)}
            </>
          )}
          {mode === "sick" && protocol.sick.map((item) => <p key={item}>{item}</p>)}
        </div>
      )}
    </div>
  );
}

function CheckpointPanel({
  day,
  checkpoint,
  log,
  onChange,
}: {
  day: number;
  checkpoint: ChallengeProgram["checkpoints"][string];
  log?: ChallengeCheckpointLog;
  onChange: (patch: Partial<ChallengeCheckpointLog>) => void;
}) {
  return (
    <div className="rounded-[24px] border border-emerald-500/30 bg-emerald-500/10 p-4">
      <SectionHeader icon={AlertTriangle} title={`Day ${day} checkpoint`} />
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div>
          <p className="text-sm font-semibold">Record</p>
          <ul className="mt-2 space-y-1 text-sm text-[var(--muted)]">
            {checkpoint.record.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">Expected progress</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{checkpoint.expected}</p>
          <p className="mt-3 text-sm font-semibold">Adjustment protocol</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{checkpoint.adjustment}</p>
        </div>
        <div className="space-y-3">
          <TextArea label="Measurements recorded" value={log?.measurements ?? ""} onChange={(value) => onChange({ measurements: value })} />
          <TextArea label="Progress notes" value={log?.progress ?? ""} onChange={(value) => onChange({ progress: value })} />
          <TextArea label="Adjustment made" value={log?.adjustment ?? ""} onChange={(value) => onChange({ adjustment: value })} />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: typeof Dumbbell; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
        <Icon size={17} />
      </div>
      <h3 className="font-semibold">{title}</h3>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/[0.04] p-3 dark:bg-white/[0.06]">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Metric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-2xl bg-black/[0.04] p-3 dark:bg-white/[0.06]">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}<span className="ml-1 text-sm font-normal text-[var(--muted)]">{unit}</span></p>
    </div>
  );
}

function DarkMetric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3 dark:bg-black/10">
      <p className="text-xs opacity-60">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}<span className="ml-1 text-sm font-normal opacity-60">{unit}</span></p>
    </div>
  );
}

function Input({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <div className="mt-2 flex items-center rounded-2xl border border-[var(--hairline)]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="decimal"
          className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
        />
        <span className="px-3 text-xs text-[var(--muted)]">{unit}</span>
      </div>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-20 w-full resize-none rounded-2xl border border-[var(--hairline)] bg-transparent p-3 text-sm outline-none"
      />
    </label>
  );
}
