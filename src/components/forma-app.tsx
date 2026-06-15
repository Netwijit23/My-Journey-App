"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Apple,
  BarChart3,
  Battery,
  Camera,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Gauge,
  GlassWater,
  HeartPulse,
  Home,
  Moon,
  Plus,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Utensils,
  Watch,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { estimateFoods } from "@/lib/food-estimator";
import { calculateRecoveryScore } from "@/lib/recovery-score";
import {
  exerciseDatabase,
  recoveryToday,
  recoveryTrend,
  metricSeries,
  progress,
  today,
  todaysGarminMetrics,
  workoutPlan,
} from "@/lib/mock-data";
import { parseWorkoutPlan } from "@/lib/workout-parser";
import { useFormaStore } from "@/store/use-forma-store";
import type { FoodEstimate, WorkoutDay } from "@/types/forma";
import { cn, formatNumber, percent } from "@/lib/utils";

const sections = [
  { label: "Dashboard", icon: Home },
  { label: "Recovery", icon: HeartPulse },
  { label: "Workout", icon: Dumbbell },
  { label: "Nutrition", icon: Utensils },
  { label: "Body", icon: Scale },
  { label: "Habits", icon: CheckCircle2 },
  { label: "Analytics", icon: BarChart3 },
];

const quickActions = [
  { label: "Log Food", icon: Apple },
  { label: "Start Workout", icon: Dumbbell },
  { label: "Log Weight", icon: Scale },
  { label: "Add Photo", icon: Camera },
  { label: "Journal", icon: HeartPulse },
];

const aiPlanExample = `Day 1: Push
Bench Press 4x8
Incline Dumbbell Press 3x10
Cable Fly 3x15

Day 2: Pull
Weighted Pull-up 4x6
Barbell Row 4x8
Incline Curl 3x12`;

export function FormaApp() {
  const { theme, setTheme, activeSection, setActiveSection } = useFormaStore();
  const [planText, setPlanText] = useState(aiPlanExample);
  const [importedPlan, setImportedPlan] = useState<WorkoutDay[]>(
    parseWorkoutPlan(aiPlanExample),
  );
  const [mealText, setMealText] = useState("2 eggs, chicken breast, jasmine rice");
  const [foodEstimates, setFoodEstimates] = useState<FoodEstimate[]>(() =>
    estimateFoods("2 eggs, chicken breast, jasmine rice"),
  );
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    setChartsReady(true);
  }, []);

  const totals = useMemo(
    () =>
      foodEstimates.reduce(
        (acc, food) => ({
          calories: acc.calories + food.calories,
          protein: acc.protein + food.protein,
          carbs: acc.carbs + food.carbs,
          fat: acc.fat + food.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [foodEstimates],
  );

  return (
    <main className="min-h-screen px-3 py-3 text-[var(--foreground)] sm:px-5 lg:px-6">
      <div className="mx-auto grid max-w-[1480px] gap-4 lg:grid-cols-[252px_minmax(0,1fr)]">
        <aside className="glass sticky top-3 hidden h-[calc(100vh-1.5rem)] rounded-[28px] p-4 lg:flex lg:flex-col">
          <Brand />
          <nav className="mt-8 space-y-1">
            {sections.map((section) => (
              <button
                key={section.label}
                onClick={() => setActiveSection(section.label)}
                className={cn(
                  "flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-medium text-[var(--muted)] transition",
                  activeSection === section.label &&
                    "bg-black text-white shadow-sm dark:bg-white dark:text-black",
                )}
              >
                <section.icon size={18} />
                {section.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto rounded-3xl bg-black p-4 text-white dark:bg-white dark:text-black">
            <p className="text-xs uppercase tracking-[0.24em] opacity-60">Personal mode</p>
            <p className="mt-3 text-lg font-semibold">Single-user setup with Supabase Auth.</p>
            <div className="mt-4 flex items-center gap-2 text-sm opacity-75">
              <ShieldCheck size={16} />
              Free-tier ready
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="glass sticky top-3 z-20 flex h-16 items-center justify-between rounded-[24px] px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <Brand compact />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  Today
                </p>
                <h1 className="text-xl font-semibold">Performance operating system</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="hidden h-10 items-center gap-2 rounded-full border border-[var(--hairline)] px-4 text-sm text-[var(--muted)] sm:flex">
                <Search size={16} />
                Search foods, lifts, notes
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="grid h-10 w-10 place-items-center rounded-full border border-[var(--hairline)]"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>

          <MobileNav activeSection={activeSection} onChange={setActiveSection} />

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <HeroOverview chartsReady={chartsReady} />
              <TodayGrid />
              <RecoveryDashboard chartsReady={chartsReady} />
              <WorkoutSection
                planText={planText}
                setPlanText={setPlanText}
                importedPlan={importedPlan}
                onImport={() => setImportedPlan(parseWorkoutPlan(planText))}
              />
              <NutritionSection
                mealText={mealText}
                setMealText={setMealText}
                estimates={foodEstimates}
                totals={totals}
                onEstimate={() => setFoodEstimates(estimateFoods(mealText))}
              />
              <AnalyticsSection chartsReady={chartsReady} />
            </div>
            <RightRail />
          </div>
        </section>
      </div>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
        <Activity size={22} />
      </div>
      {!compact && (
        <div>
          <p className="text-xl font-semibold tracking-tight">My Journey</p>
          <p className="text-xs text-[var(--muted)]">Health OS</p>
        </div>
      )}
    </div>
  );
}

function MobileNav({
  activeSection,
  onChange,
}: {
  activeSection: string;
  onChange: (section: string) => void;
}) {
  return (
    <nav className="mt-3 grid grid-cols-7 gap-1 rounded-[22px] border border-[var(--hairline)] bg-[var(--card-strong)] p-1 lg:hidden">
      {sections.map((section) => (
        <button
          key={section.label}
          onClick={() => onChange(section.label)}
          className={cn(
            "grid h-11 place-items-center rounded-2xl text-[var(--muted)]",
            activeSection === section.label && "bg-black text-white dark:bg-white dark:text-black",
          )}
          aria-label={section.label}
        >
          <section.icon size={18} />
        </button>
      ))}
    </nav>
  );
}

function HeroOverview({ chartsReady }: { chartsReady: boolean }) {
  return (
    <section className="glass overflow-hidden rounded-[30px] p-5 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-[var(--muted)]"
          >
            Readiness score
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-2 max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl"
          >
            {recoveryToday.score} is a strong day to train.
          </motion.h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            {recoveryToday.recommendation} {recoveryToday.sleepImpact}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-black px-4 text-sm font-medium text-white transition hover:opacity-85 dark:bg-white dark:text-black"
              >
                <action.icon size={16} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-[26px] bg-black p-4 text-white dark:bg-white dark:text-black">
          <div className="flex items-center justify-between">
            <p className="text-sm opacity-60">Recovery score</p>
            <HeartPulse size={18} />
          </div>
          <p className="mt-4 text-6xl font-semibold">{recoveryToday.score}</p>
          <p className="mt-1 text-sm opacity-60">{recoveryToday.label}</p>
          <div className="mt-6 h-32">
            {chartsReady && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recoveryTrend}>
                  <Area
                    type="monotone"
                    dataKey="recovery"
                    stroke="currentColor"
                    fill="currentColor"
                    fillOpacity={0.16}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function TodayGrid() {
  const cards = [
    { label: "Current weight", value: `${today.weight} lb`, detail: `${progress.weightChange} lb this week`, icon: Scale },
    { label: "Daily calories", value: today.calories, detail: `${percent(today.calories, today.calorieGoal)}% of target`, icon: Utensils },
    { label: "Protein", value: `${today.protein} g`, detail: `${today.proteinGoal - today.protein} g remaining`, icon: Apple },
    { label: "Water", value: `${today.water} L`, detail: `${percent(today.water, today.waterGoal)}% complete`, icon: GlassWater },
    { label: "Steps", value: formatNumber(today.steps), detail: `${percent(today.steps, today.stepsGoal)}% complete`, icon: Watch },
    { label: "Sleep", value: `${today.sleep} h`, detail: "Good recovery window", icon: Moon },
    { label: "Workout", value: "Planned", detail: today.workoutStatus, icon: Dumbbell },
    { label: "Habits", value: `${today.habitsDone}/${today.habitsTotal}`, detail: "2 left today", icon: CheckCircle2 },
    { label: "Recovery", value: `${recoveryToday.score}/100`, detail: recoveryToday.suggestedIntensity, icon: HeartPulse },
    { label: "Body Battery", value: todaysGarminMetrics.bodyBattery, detail: `${todaysGarminMetrics.recoveryTimeHours}h recovery time`, icon: Battery },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="panel rounded-[24px] p-4">
          <div className="flex items-center justify-between text-[var(--muted)]">
            <p className="text-sm">{card.label}</p>
            <card.icon size={18} />
          </div>
          <p className="mt-4 text-2xl font-semibold">{card.value}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{card.detail}</p>
        </div>
      ))}
    </section>
  );
}

function RecoveryDashboard({ chartsReady }: { chartsReady: boolean }) {
  const [manualMetrics, setManualMetrics] = useState(todaysGarminMetrics);
  const recovery = useMemo(() => calculateRecoveryScore(manualMetrics), [manualMetrics]);
  const positiveFactors = recovery.factors.filter((factor) => factor.impact === "positive");
  const limitingFactors = recovery.factors.filter((factor) => factor.impact !== "positive");

  function updateMetric(key: keyof typeof manualMetrics, value: number) {
    setManualMetrics((current) => ({ ...current, [key]: value }));
  }

  return (
    <section className="panel rounded-[30px] p-5">
      <div className="grid gap-5 2xl:grid-cols-[360px_1fr]">
        <div className="rounded-[26px] bg-black p-5 text-white dark:bg-white dark:text-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] opacity-60">Garmin recovery</p>
              <h2 className="mt-2 text-2xl font-semibold">Today&apos;s readiness</h2>
            </div>
            <Gauge size={24} />
          </div>
          <div className="mt-8 flex items-end gap-2">
          <p className="text-7xl font-semibold">{recovery.score}</p>
            <p className="pb-3 text-lg opacity-60">/100</p>
          </div>
          <p className="mt-3 text-lg font-medium">{recovery.label}</p>
          <p className="mt-1 text-sm opacity-70">{recovery.recommendation}</p>
          <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm leading-6 dark:bg-black/10">
            <p className="font-medium">Suggested intensity</p>
            <p className="opacity-75">{recovery.suggestedIntensity}</p>
          </div>
          <p className="mt-4 text-xs leading-5 opacity-55">{recovery.disclaimer}</p>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-3">
            <ImpactCard title="Sleep impact" value={manualMetrics.sleepScore} detail={recovery.sleepImpact} />
            <ImpactCard title="Stress impact" value={manualMetrics.stressScore} detail={recovery.stressImpact} />
            <ImpactCard title="Training load" value={manualMetrics.workoutIntensity} detail={recovery.trainingLoadImpact} />
          </div>

          <div className="grid gap-3 xl:grid-cols-[1fr_280px]">
            <div className="rounded-[24px] border border-[var(--hairline)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">7-day recovery trend</h3>
                  <p className="text-sm text-[var(--muted)]">Estimated personal readiness from Garmin-style inputs.</p>
                </div>
                <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-black">
                  Manual entry ready
                </span>
              </div>
              <div className="mt-4 h-52">
                {chartsReady && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={recoveryTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,.18)" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="recovery" stroke="#d5b56e" fill="#d5b56e" fillOpacity={0.22} strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--hairline)] p-4">
              <h3 className="font-semibold">Key factors</h3>
              <div className="mt-4 space-y-3">
                {[...positiveFactors, ...limitingFactors].slice(0, 4).map((factor) => (
                  <div key={factor.key}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span>{factor.label}</span>
                      <span className="text-[var(--muted)]">{factor.score}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted)]">{factor.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <MiniTrend title="HRV" dataKey="hrv" unit="ms" chartsReady={chartsReady} />
            <MiniTrend title="Resting HR" dataKey="restingHeartRate" unit="bpm" chartsReady={chartsReady} />
            <MiniTrend title="Sleep" dataKey="sleepDuration" unit="h" chartsReady={chartsReady} />
            <MiniTrend title="Stress" dataKey="stressScore" unit="" chartsReady={chartsReady} />
            <MiniTrend title="Training load" dataKey="workoutIntensity" unit="" chartsReady={chartsReady} />
          </div>

          <div className="rounded-[24px] border border-[var(--hairline)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Manual Garmin entry</h3>
                <p className="text-sm text-[var(--muted)]">Use this when Garmin API access is unavailable.</p>
              </div>
              <span className="rounded-full bg-black/[0.06] px-3 py-1 text-xs text-[var(--muted)] dark:bg-white/[0.08]">
                Estimated score
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricInput label="HRV" value={manualMetrics.hrv} onChange={(value) => updateMetric("hrv", value)} />
              <MetricInput label="Resting HR" value={manualMetrics.restingHeartRate} onChange={(value) => updateMetric("restingHeartRate", value)} />
              <MetricInput label="Sleep hours" value={manualMetrics.sleepDuration} step="0.1" onChange={(value) => updateMetric("sleepDuration", value)} />
              <MetricInput label="Sleep score" value={manualMetrics.sleepScore} onChange={(value) => updateMetric("sleepScore", value)} />
              <MetricInput label="Stress" value={manualMetrics.stressScore} onChange={(value) => updateMetric("stressScore", value)} />
              <MetricInput label="Body Battery" value={manualMetrics.bodyBattery} onChange={(value) => updateMetric("bodyBattery", value)} />
              <MetricInput label="Workout intensity" value={manualMetrics.workoutIntensity} onChange={(value) => updateMetric("workoutIntensity", value)} />
              <MetricInput label="Recovery hours" value={manualMetrics.recoveryTimeHours} onChange={(value) => updateMetric("recoveryTimeHours", value)} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WorkoutSection({
  planText,
  setPlanText,
  importedPlan,
  onImport,
}: {
  planText: string;
  setPlanText: (value: string) => void;
  importedPlan: WorkoutDay[];
  onImport: () => void;
}) {
  return (
    <section className="grid gap-4 2xl:grid-cols-[1fr_420px]">
      <div className="panel rounded-[28px] p-5">
        <SectionTitle icon={Dumbbell} title="Workout tracker" action="Start session" />
        <div className="mt-5 grid gap-3">
          {workoutPlan.map((day) => (
            <div key={day.name} className="rounded-[22px] border border-[var(--hairline)] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{day.name}</p>
                  <p className="text-sm text-[var(--muted)]">{day.focus}</p>
                </div>
                <ChevronRight size={18} className="text-[var(--muted)]" />
              </div>
              <div className="mt-4 grid gap-2">
                {day.exercises.map((exercise) => (
                  <div
                    key={exercise.name}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-sm"
                  >
                    <span>{exercise.name}</span>
                    <span className="text-[var(--muted)]">{exercise.sets} x {exercise.reps}</span>
                    <span className="text-[var(--muted)]">{exercise.weight || "Body"}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="panel rounded-[28px] p-5">
        <SectionTitle icon={Sparkles} title="AI workout import" action="Parse" onAction={onImport} />
        <textarea
          value={planText}
          onChange={(event) => setPlanText(event.target.value)}
          className="mt-5 min-h-44 w-full resize-none rounded-[20px] border border-[var(--hairline)] bg-transparent p-4 text-sm outline-none"
        />
        <div className="mt-4 space-y-3">
          {importedPlan.map((day) => (
            <div key={day.name} className="rounded-[20px] bg-black/[0.04] p-3 dark:bg-white/[0.06]">
              <p className="text-sm font-semibold">{day.name}</p>
              <p className="text-xs text-[var(--muted)]">{day.exercises.length} exercises detected</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function NutritionSection({
  mealText,
  setMealText,
  estimates,
  totals,
  onEstimate,
}: {
  mealText: string;
  setMealText: (value: string) => void;
  estimates: FoodEstimate[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  onEstimate: () => void;
}) {
  return (
    <section className="panel rounded-[28px] p-5">
      <SectionTitle icon={Utensils} title="Nutrition tracker" action="Estimate meal" onAction={onEstimate} />
      <div className="mt-5 grid gap-4 xl:grid-cols-[360px_1fr]">
        <div>
          <textarea
            value={mealText}
            onChange={(event) => setMealText(event.target.value)}
            className="min-h-36 w-full resize-none rounded-[20px] border border-[var(--hairline)] bg-transparent p-4 text-sm outline-none"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Macro label="Calories" value={Math.round(totals.calories)} unit="kcal" />
            <Macro label="Protein" value={Math.round(totals.protein)} unit="g" />
            <Macro label="Carbs" value={Math.round(totals.carbs)} unit="g" />
            <Macro label="Fat" value={Math.round(totals.fat)} unit="g" />
          </div>
        </div>
        <div className="space-y-3">
          {estimates.map((food) => (
            <div key={food.name} className="rounded-[22px] border border-[var(--hairline)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{food.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {food.source} · confidence {Math.round(food.confidence * 100)}%
                  </p>
                </div>
                <button className="grid h-9 w-9 place-items-center rounded-full bg-black text-white dark:bg-white dark:text-black">
                  <Plus size={16} />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-sm text-[var(--muted)]">
                <span>{food.calories} kcal</span>
                <span>{food.protein}g P</span>
                <span>{food.carbs}g C</span>
                <span>{food.fat}g F</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnalyticsSection({ chartsReady }: { chartsReady: boolean }) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartCard title="Weight trend" chartsReady={chartsReady}>
        <LineChart data={metricSeries}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,.18)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} />
          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip />
          <Line dataKey="weight" stroke="#111111" strokeWidth={3} dot={false} />
        </LineChart>
      </ChartCard>
      <ChartCard title="Workout volume" chartsReady={chartsReady}>
        <BarChart data={metricSeries}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120,120,120,.18)" />
          <XAxis dataKey="date" tickLine={false} axisLine={false} />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="volume" fill="#d5b56e" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ChartCard>
    </section>
  );
}

function RightRail() {
  return (
    <aside className="space-y-4">
      <div className="panel rounded-[28px] p-5">
        <SectionTitle icon={HeartPulse} title="Body and recovery" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Macro label="Waist" value={31.8} unit="in" />
          <Macro label="Body fat" value={14.2} unit="%" />
          <Macro label="Sleep avg" value={7.3} unit="h" />
          <Macro label="Mood" value={8} unit="/10" />
        </div>
      </div>
      <div className="panel rounded-[28px] p-5">
        <SectionTitle icon={CheckCircle2} title="Habits" />
        <div className="mt-5 space-y-3">
          {["Workout", "Protein goal", "Water goal", "Steps", "Stretching", "Sleep"].map((habit, index) => (
            <div key={habit} className="flex items-center justify-between rounded-2xl bg-black/[0.04] p-3 dark:bg-white/[0.06]">
              <span className="text-sm">{habit}</span>
              <CheckCircle2 size={18} className={index < 4 ? "text-emerald-500" : "text-[var(--muted)]"} />
            </div>
          ))}
        </div>
      </div>
      <div className="panel rounded-[28px] p-5">
        <SectionTitle icon={Search} title="Exercise database" />
        <div className="mt-5 space-y-3">
          {exerciseDatabase.map((exercise) => (
            <div key={exercise.name} className="rounded-2xl border border-[var(--hairline)] p-3">
              <p className="text-sm font-semibold">{exercise.name}</p>
              <p className="text-xs text-[var(--muted)]">{exercise.muscle} · {exercise.equipment} · {exercise.category}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  action,
  onAction,
}: {
  icon: typeof Activity;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black text-white dark:bg-white dark:text-black">
          <Icon size={18} />
        </div>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {action && (
        <button
          onClick={onAction}
          className="h-10 rounded-full bg-black px-4 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function Macro({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-[20px] bg-black/[0.04] p-3 dark:bg-white/[0.06]">
      <p className="text-xs text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold">
        {value}
        <span className="ml-1 text-sm font-normal text-[var(--muted)]">{unit}</span>
      </p>
    </div>
  );
}

function ImpactCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="rounded-[22px] border border-[var(--hairline)] p-4">
      <p className="text-sm text-[var(--muted)]">{title}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-sm leading-5 text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function MetricInput({
  label,
  value,
  step = "1",
  onChange,
}: {
  label: string;
  value: number;
  step?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-[18px] bg-black/[0.04] p-3 dark:bg-white/[0.06]">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 h-9 w-full rounded-xl border border-[var(--hairline)] bg-transparent px-3 text-sm outline-none"
      />
    </label>
  );
}

function MiniTrend({
  title,
  dataKey,
  unit,
  chartsReady,
}: {
  title: string;
  dataKey: string;
  unit: string;
  chartsReady: boolean;
}) {
  const latest = recoveryTrend[recoveryTrend.length - 1][
    dataKey as keyof (typeof recoveryTrend)[number]
  ];

  return (
    <div className="rounded-[22px] border border-[var(--hairline)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted)]">{title} trend</p>
          <p className="mt-1 text-xl font-semibold">
            {latest}
            {unit && <span className="ml-1 text-sm font-normal text-[var(--muted)]">{unit}</span>}
          </p>
        </div>
      </div>
      <div className="mt-3 h-20">
        {chartsReady && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recoveryTrend}>
              <Line type="monotone" dataKey={dataKey} stroke="#d5b56e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  chartsReady,
}: {
  title: string;
  children: React.ReactElement;
  chartsReady: boolean;
}) {
  return (
    <div className="panel rounded-[28px] p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 h-64">
        {chartsReady && (
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
