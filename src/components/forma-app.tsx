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
  Flame,
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
  Trash2,
  Utensils,
  UserRound,
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

import { ChallengeProgramSection } from "@/components/challenge-program";
import { estimateFoods } from "@/lib/food-estimator";
import { calculateRecoveryScore } from "@/lib/recovery-score";
import {
  exerciseDatabase,
  recoveryToday,
  recoveryTrend,
  metricSeries,
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
  { label: "Profile", icon: UserRound },
  { label: "Challenge", icon: Flame },
  { label: "Recovery", icon: HeartPulse },
  { label: "Workout", icon: Dumbbell },
  { label: "Nutrition", icon: Utensils },
  { label: "Body", icon: Scale },
  { label: "Habits", icon: CheckCircle2 },
  { label: "Analytics", icon: BarChart3 },
];

const quickActions = [
  { label: "Log Food", icon: Apple, action: "food" },
  { label: "Start Workout", icon: Dumbbell, action: "workout" },
  { label: "Log Weight", icon: Scale, action: "weight" },
  { label: "Add Photo", icon: Camera, action: "photo" },
  { label: "Journal", icon: HeartPulse, action: "journal" },
];

const aiPlanExample = `Day 1: Push
Bench Press 4x8
Incline Dumbbell Press 3x10
Cable Fly 3x15

Day 2: Pull
Weighted Pull-up 4x6
Barbell Row 4x8
Incline Curl 3x12`;

type LoggedFood = FoodEstimate & {
  id: string;
  loggedAt: string;
};

type WeightEntry = {
  id: string;
  value: number;
  loggedAt: string;
};

type JournalEntry = {
  id: string;
  text: string;
  loggedAt: string;
};

type PersonalProfile = {
  name: string;
  age: string;
  sex: "male" | "female";
  heightCm: string;
  weightKg: string;
  waistCm: string;
  bodyFatPercent: string;
  goal: "fat_loss" | "recomposition" | "maintenance" | "muscle_gain";
  activityLevel: "sedentary" | "light" | "moderate" | "very_active" | "athlete";
  proteinPerKg: string;
  waterLiters: string;
  stepsGoal: string;
  sleepGoal: string;
  garminHrv: string;
  garminHrvBaseline: string;
  garminRestingHeartRate: string;
  garminRestingHeartRateBaseline: string;
  garminSleepHours: string;
  garminSleepScore: string;
  garminStressScore: string;
  garminBodyBattery: string;
  garminTrainingReadiness: string;
  garminRecoveryHours: string;
  garminVo2Max: string;
  garminIntensityMinutes: string;
};

type ProfileSummary = {
  isComplete: boolean;
  bmr: number;
  tdee: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  water: number;
  steps: number;
  sleep: number;
  bmi: number;
  goalLabel: string;
};

type AppData = {
  profile: PersonalProfile;
  foods: LoggedFood[];
  workoutSessions: number;
  weights: WeightEntry[];
  photos: number;
  journals: JournalEntry[];
  habits: Record<string, boolean>;
};

const initialProfile: PersonalProfile = {
  name: "",
  age: "",
  sex: "male",
  heightCm: "",
  weightKg: "",
  waistCm: "",
  bodyFatPercent: "",
  goal: "fat_loss",
  activityLevel: "moderate",
  proteinPerKg: "2.2",
  waterLiters: "3",
  stepsGoal: "10000",
  sleepGoal: "7.5",
  garminHrv: "",
  garminHrvBaseline: "",
  garminRestingHeartRate: "",
  garminRestingHeartRateBaseline: "",
  garminSleepHours: "",
  garminSleepScore: "",
  garminStressScore: "",
  garminBodyBattery: "",
  garminTrainingReadiness: "",
  garminRecoveryHours: "",
  garminVo2Max: "",
  garminIntensityMinutes: "",
};

const initialAppData: AppData = {
  profile: initialProfile,
  foods: [],
  workoutSessions: 0,
  weights: [],
  photos: 0,
  journals: [],
  habits: {
    Workout: true,
    "Protein goal": true,
    "Water goal": true,
    Steps: true,
    Stretching: false,
    Sleep: false,
  },
};

const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

const goalAdjustments = {
  fat_loss: -500,
  recomposition: -200,
  maintenance: 0,
  muscle_gain: 250,
};

const goalLabels = {
  fat_loss: "Fat loss",
  recomposition: "Recomposition",
  maintenance: "Maintenance",
  muscle_gain: "Muscle gain",
};

function n(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function calculateProfileSummary(profile: PersonalProfile): ProfileSummary {
  const age = n(profile.age);
  const height = n(profile.heightCm);
  const weight = n(profile.weightKg);
  const isComplete = age > 0 && height > 0 && weight > 0;
  const sexOffset = profile.sex === "male" ? 5 : -161;
  const bmr = isComplete ? Math.round(10 * weight + 6.25 * height - 5 * age + sexOffset) : 0;
  const tdee = Math.round(bmr * activityMultipliers[profile.activityLevel]);
  const calories = Math.max(1200, Math.round(tdee + goalAdjustments[profile.goal]));
  const protein = Math.round(weight * n(profile.proteinPerKg, 2.2));
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const heightM = height / 100;

  return {
    isComplete,
    bmr,
    tdee,
    calories: isComplete ? calories : 0,
    protein: isComplete ? protein : 0,
    fat: isComplete ? fat : 0,
    carbs: isComplete ? carbs : 0,
    water: n(profile.waterLiters, 3),
    steps: n(profile.stepsGoal, 10000),
    sleep: n(profile.sleepGoal, 7.5),
    bmi: isComplete && heightM > 0 ? Math.round((weight / (heightM * heightM)) * 10) / 10 : 0,
    goalLabel: goalLabels[profile.goal],
  };
}

function garminMetricsFromProfile(profile: PersonalProfile) {
  return {
    date: "Today",
    restingHeartRate: n(profile.garminRestingHeartRate, todaysGarminMetrics.restingHeartRate),
    hrv: n(profile.garminHrv, todaysGarminMetrics.hrv),
    hrvBaseline: n(profile.garminHrvBaseline, todaysGarminMetrics.hrvBaseline),
    restingHeartRateBaseline: n(
      profile.garminRestingHeartRateBaseline,
      todaysGarminMetrics.restingHeartRateBaseline,
    ),
    sleepDuration: n(profile.garminSleepHours, todaysGarminMetrics.sleepDuration),
    sleepScore: n(profile.garminSleepScore, todaysGarminMetrics.sleepScore),
    deepSleepMinutes: todaysGarminMetrics.deepSleepMinutes,
    remSleepMinutes: todaysGarminMetrics.remSleepMinutes,
    stressScore: n(profile.garminStressScore, todaysGarminMetrics.stressScore),
    bodyBattery: n(profile.garminBodyBattery, todaysGarminMetrics.bodyBattery),
    trainingReadiness: n(profile.garminTrainingReadiness, todaysGarminMetrics.trainingReadiness),
    trainingStatus: todaysGarminMetrics.trainingStatus,
    recoveryTimeHours: n(profile.garminRecoveryHours, todaysGarminMetrics.recoveryTimeHours),
    vo2Max: n(profile.garminVo2Max, todaysGarminMetrics.vo2Max),
    steps: n(profile.stepsGoal, todaysGarminMetrics.steps),
    caloriesBurned: todaysGarminMetrics.caloriesBurned,
    workoutIntensity: n(profile.garminIntensityMinutes, todaysGarminMetrics.workoutIntensity),
    intensityMinutes: n(profile.garminIntensityMinutes, todaysGarminMetrics.intensityMinutes),
  };
}

export function FormaApp() {
  const { theme, setTheme, activeSection, setActiveSection } = useFormaStore();
  const [appData, setAppData] = useState<AppData>(initialAppData);
  const [notice, setNotice] = useState("Ready to log today's work.");
  const [planText, setPlanText] = useState(aiPlanExample);
  const [importedPlan, setImportedPlan] = useState<WorkoutDay[]>(
    parseWorkoutPlan(aiPlanExample),
  );
  const [mealText, setMealText] = useState("2 eggs, chicken breast, jasmine rice");
  const [foodEstimates, setFoodEstimates] = useState<FoodEstimate[]>(() =>
    estimateFoods("2 eggs, chicken breast, jasmine rice"),
  );
  const [chartsReady, setChartsReady] = useState(false);
  const profileSummary = useMemo(
    () => calculateProfileSummary(appData.profile),
    [appData.profile],
  );
  const profileGarminMetrics = useMemo(
    () => garminMetricsFromProfile(appData.profile),
    [appData.profile],
  );
  const profileRecovery = useMemo(
    () => calculateRecoveryScore(profileGarminMetrics),
    [profileGarminMetrics],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    setChartsReady(true);
    const saved = window.localStorage.getItem("my-journey-app-data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<AppData>;
        setAppData({
          ...initialAppData,
          ...parsed,
          profile: { ...initialProfile, ...parsed.profile },
          habits: { ...initialAppData.habits, ...parsed.habits },
        });
      } catch {
        window.localStorage.removeItem("my-journey-app-data");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("my-journey-app-data", JSON.stringify(appData));
  }, [appData]);

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

  function scrollToSection(section: string) {
    setActiveSection(section);
    document
      .getElementById(section.toLowerCase())
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleQuickAction(action: string) {
    if (action === "food") {
      scrollToSection("Nutrition");
      setNotice("Type a meal, then tap Estimate meal or + to log foods.");
      return;
    }

    if (action === "workout") {
      setAppData((current) => ({
        ...current,
        workoutSessions: current.workoutSessions + 1,
        habits: { ...current.habits, Workout: true },
      }));
      scrollToSection("Workout");
      setNotice("Workout started. Today's workout habit is marked complete.");
      return;
    }

    if (action === "weight") {
      const defaultWeight = appData.profile.weightKg || String(today.weight);
      const value = Number(window.prompt("Enter today's weight in kg", defaultWeight));
      if (!Number.isFinite(value) || value <= 0) return;
      setAppData((current) => ({
        ...current,
        weights: [{ id: crypto.randomUUID(), value, loggedAt: new Date().toISOString() }, ...current.weights],
        profile: { ...current.profile, weightKg: String(value) },
      }));
      scrollToSection("Body");
      setNotice(`Logged weight: ${value} kg.`);
      return;
    }

    if (action === "photo") {
      setAppData((current) => ({ ...current, photos: current.photos + 1 }));
      scrollToSection("Body");
      setNotice("Progress photo placeholder added. File uploads can be connected next.");
      return;
    }

    if (action === "journal") {
      const text = window.prompt("Journal note for today");
      if (!text?.trim()) return;
      setAppData((current) => ({
        ...current,
        journals: [{ id: crypto.randomUUID(), text: text.trim(), loggedAt: new Date().toISOString() }, ...current.journals],
      }));
      scrollToSection("Body");
      setNotice("Journal entry saved on this device.");
    }
  }

  function logFood(food: FoodEstimate) {
    setAppData((current) => ({
      ...current,
      foods: [{ ...food, id: crypto.randomUUID(), loggedAt: new Date().toISOString() }, ...current.foods],
      habits: { ...current.habits, "Protein goal": true },
    }));
    setNotice(`${food.name} logged.`);
  }

  function removeFood(id: string) {
    setAppData((current) => ({
      ...current,
      foods: current.foods.filter((food) => food.id !== id),
    }));
    setNotice("Food log removed.");
  }

  function toggleHabit(habit: string) {
    setAppData((current) => ({
      ...current,
      habits: { ...current.habits, [habit]: !current.habits[habit] },
    }));
  }

  function updateProfile(patch: Partial<PersonalProfile>) {
    setAppData((current) => ({
      ...current,
      profile: { ...current.profile, ...patch },
    }));
  }

  return (
    <main className="min-h-screen px-3 py-3 text-[var(--foreground)] sm:px-5 lg:px-6">
      <div className="mx-auto grid max-w-[1480px] gap-4 lg:grid-cols-[252px_minmax(0,1fr)]">
        <aside className="glass sticky top-3 hidden h-[calc(100vh-1.5rem)] rounded-[28px] p-4 lg:flex lg:flex-col">
          <Brand />
          <nav className="mt-8 space-y-1">
            {sections.map((section) => (
              <button
                key={section.label}
                onClick={() => scrollToSection(section.label)}
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
              <button
                onClick={() => {
                  scrollToSection("Nutrition");
                  setNotice("Search is not connected to USDA yet. Use the meal parser for today's testing.");
                }}
                className="hidden h-10 items-center gap-2 rounded-full border border-[var(--hairline)] px-4 text-sm text-[var(--muted)] sm:flex"
              >
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

          <MobileNav activeSection={activeSection} onChange={scrollToSection} />

          <div className="mt-3 rounded-[20px] border border-[var(--hairline)] bg-[var(--card-strong)] px-4 py-3 text-sm text-[var(--muted)]">
            {notice}
          </div>

          <div id="dashboard" className="mt-4 grid scroll-mt-24 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <HeroOverview
                chartsReady={chartsReady}
                onQuickAction={handleQuickAction}
                profile={appData.profile}
                recovery={profileRecovery}
              />
              <TodayGrid
                appData={appData}
                summary={profileSummary}
                recovery={profileRecovery}
              />
              <ProfileSection
                profile={appData.profile}
                summary={profileSummary}
                onChange={updateProfile}
                onSaved={() => setNotice("Profile saved. Dashboard targets recalculated.")}
              />
              <ChallengeProgramSection />
              <RecoveryDashboard
                chartsReady={chartsReady}
                profileMetrics={profileGarminMetrics}
              />
              <WorkoutSection
                planText={planText}
                setPlanText={setPlanText}
                importedPlan={importedPlan}
                sessions={appData.workoutSessions}
                onStartWorkout={() => handleQuickAction("workout")}
                onImport={() => {
                  setImportedPlan(parseWorkoutPlan(planText));
                  setNotice("Workout plan parsed. Review the detected days below.");
                }}
              />
              <NutritionSection
                mealText={mealText}
                setMealText={setMealText}
                estimates={foodEstimates}
                totals={totals}
                loggedFoods={appData.foods}
                onLogFood={logFood}
                onRemoveFood={removeFood}
                onEstimate={() => {
                  const next = estimateFoods(mealText);
                  setFoodEstimates(next);
                  setNotice(next.length ? "Meal estimated. Tap + to log items." : "No known foods found. Try eggs, chicken breast, rice, oats, or banana.");
                }}
              />
              <AnalyticsSection chartsReady={chartsReady} />
            </div>
            <RightRail appData={appData} onToggleHabit={toggleHabit} />
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
    <nav className="mt-3 grid grid-cols-9 gap-1 rounded-[22px] border border-[var(--hairline)] bg-[var(--card-strong)] p-1 lg:hidden">
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

function HeroOverview({
  chartsReady,
  onQuickAction,
  profile,
  recovery,
}: {
  chartsReady: boolean;
  onQuickAction: (action: string) => void;
  profile: PersonalProfile;
  recovery: typeof recoveryToday;
}) {
  const greeting = profile.name ? `${profile.name}, ` : "";
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
            {greeting}{recovery.score} is your readiness score.
          </motion.h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
            {recovery.recommendation} {recovery.sleepImpact}
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => onQuickAction(action.action)}
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
          <p className="mt-4 text-6xl font-semibold">{recovery.score}</p>
          <p className="mt-1 text-sm opacity-60">{recovery.label}</p>
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

function TodayGrid({
  appData,
  summary,
  recovery,
}: {
  appData: AppData;
  summary: ProfileSummary;
  recovery: typeof recoveryToday;
}) {
  const latestWeight = appData.weights[0]?.value ?? n(appData.profile.weightKg, today.weight);
  const todaysLoggedCalories = appData.foods.reduce((sum, food) => sum + food.calories, 0);
  const todaysLoggedProtein = appData.foods.reduce((sum, food) => sum + food.protein, 0);
  const completedHabits = Object.values(appData.habits).filter(Boolean).length;
  const totalHabits = Object.values(appData.habits).length;
  const cards = [
    { label: "Current weight", value: latestWeight ? `${latestWeight} kg` : "Set up", detail: appData.weights[0] ? "Logged today on this device" : "Enter profile weight", icon: Scale },
    { label: "Daily calories", value: Math.round(todaysLoggedCalories || summary.calories || today.calories), detail: `${percent(todaysLoggedCalories || 0, summary.calories || today.calorieGoal)}% logged`, icon: Utensils },
    { label: "Protein", value: `${Math.round(todaysLoggedProtein || 0)} g`, detail: `${Math.max(0, Math.round((summary.protein || today.proteinGoal) - todaysLoggedProtein))} g remaining`, icon: Apple },
    { label: "Water target", value: `${summary.water} L`, detail: "Profile target", icon: GlassWater },
    { label: "Steps target", value: formatNumber(summary.steps), detail: "Profile target", icon: Watch },
    { label: "Sleep target", value: `${summary.sleep} h`, detail: "Profile target", icon: Moon },
    { label: "Workout", value: appData.workoutSessions ? "Started" : "Planned", detail: appData.workoutSessions ? `${appData.workoutSessions} session logged` : today.workoutStatus, icon: Dumbbell },
    { label: "Habits", value: `${completedHabits}/${totalHabits}`, detail: `${Math.max(0, totalHabits - completedHabits)} left today`, icon: CheckCircle2 },
    { label: "Recovery", value: `${recovery.score}/100`, detail: recovery.suggestedIntensity, icon: HeartPulse },
    { label: "Body Battery", value: appData.profile.garminBodyBattery || todaysGarminMetrics.bodyBattery, detail: `${appData.profile.garminRecoveryHours || todaysGarminMetrics.recoveryTimeHours}h recovery time`, icon: Battery },
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

function ProfileSection({
  profile,
  summary,
  onChange,
  onSaved,
}: {
  profile: PersonalProfile;
  summary: ProfileSummary;
  onChange: (patch: Partial<PersonalProfile>) => void;
  onSaved: () => void;
}) {
  return (
    <section id="profile" className="panel scroll-mt-24 rounded-[30px] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Your profile</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Personal targets and Garmin inputs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Enter your real numbers here. My Journey calculates calories, macros, hydration, steps, BMI, and recovery from your profile.
          </p>
        </div>
        <button
          onClick={onSaved}
          className="h-11 rounded-full bg-black px-5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Save profile
        </button>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-[24px] border border-[var(--hairline)] p-4">
            <SectionTitle icon={UserRound} title="Body and goal" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ProfileField label="Name" value={profile.name} onChange={(name) => onChange({ name })} />
              <ProfileField label="Age" value={profile.age} inputMode="numeric" onChange={(age) => onChange({ age })} />
              <ProfileSelect label="Sex" value={profile.sex} onChange={(sex) => onChange({ sex: sex as PersonalProfile["sex"] })} options={[["male", "Male"], ["female", "Female"]]} />
              <ProfileField label="Height" unit="cm" value={profile.heightCm} inputMode="decimal" onChange={(heightCm) => onChange({ heightCm })} />
              <ProfileField label="Weight" unit="kg" value={profile.weightKg} inputMode="decimal" onChange={(weightKg) => onChange({ weightKg })} />
              <ProfileField label="Waist" unit="cm" value={profile.waistCm} inputMode="decimal" onChange={(waistCm) => onChange({ waistCm })} />
              <ProfileField label="Body fat" unit="%" value={profile.bodyFatPercent} inputMode="decimal" onChange={(bodyFatPercent) => onChange({ bodyFatPercent })} />
              <ProfileSelect
                label="Goal"
                value={profile.goal}
                onChange={(goal) => onChange({ goal: goal as PersonalProfile["goal"] })}
                options={[
                  ["fat_loss", "Fat loss"],
                  ["recomposition", "Recomposition"],
                  ["maintenance", "Maintenance"],
                  ["muscle_gain", "Muscle gain"],
                ]}
              />
              <ProfileSelect
                label="Activity"
                value={profile.activityLevel}
                onChange={(activityLevel) => onChange({ activityLevel: activityLevel as PersonalProfile["activityLevel"] })}
                options={[
                  ["sedentary", "Mostly sitting"],
                  ["light", "Light activity"],
                  ["moderate", "Moderate training"],
                  ["very_active", "Very active"],
                  ["athlete", "Athlete"],
                ]}
              />
              <ProfileField label="Protein" unit="g/kg" value={profile.proteinPerKg} inputMode="decimal" onChange={(proteinPerKg) => onChange({ proteinPerKg })} />
              <ProfileField label="Water" unit="L" value={profile.waterLiters} inputMode="decimal" onChange={(waterLiters) => onChange({ waterLiters })} />
              <ProfileField label="Steps" unit="/day" value={profile.stepsGoal} inputMode="numeric" onChange={(stepsGoal) => onChange({ stepsGoal })} />
              <ProfileField label="Sleep" unit="h" value={profile.sleepGoal} inputMode="decimal" onChange={(sleepGoal) => onChange({ sleepGoal })} />
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--hairline)] p-4">
            <SectionTitle icon={Watch} title="Garmin numbers" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <ProfileField label="HRV today" unit="ms" value={profile.garminHrv} inputMode="decimal" onChange={(garminHrv) => onChange({ garminHrv })} />
              <ProfileField label="HRV baseline" unit="ms" value={profile.garminHrvBaseline} inputMode="decimal" onChange={(garminHrvBaseline) => onChange({ garminHrvBaseline })} />
              <ProfileField label="Resting HR" unit="bpm" value={profile.garminRestingHeartRate} inputMode="decimal" onChange={(garminRestingHeartRate) => onChange({ garminRestingHeartRate })} />
              <ProfileField label="RHR baseline" unit="bpm" value={profile.garminRestingHeartRateBaseline} inputMode="decimal" onChange={(garminRestingHeartRateBaseline) => onChange({ garminRestingHeartRateBaseline })} />
              <ProfileField label="Sleep" unit="h" value={profile.garminSleepHours} inputMode="decimal" onChange={(garminSleepHours) => onChange({ garminSleepHours })} />
              <ProfileField label="Sleep score" value={profile.garminSleepScore} inputMode="numeric" onChange={(garminSleepScore) => onChange({ garminSleepScore })} />
              <ProfileField label="Stress" value={profile.garminStressScore} inputMode="numeric" onChange={(garminStressScore) => onChange({ garminStressScore })} />
              <ProfileField label="Body Battery" value={profile.garminBodyBattery} inputMode="numeric" onChange={(garminBodyBattery) => onChange({ garminBodyBattery })} />
              <ProfileField label="Training readiness" value={profile.garminTrainingReadiness} inputMode="numeric" onChange={(garminTrainingReadiness) => onChange({ garminTrainingReadiness })} />
              <ProfileField label="Recovery time" unit="h" value={profile.garminRecoveryHours} inputMode="decimal" onChange={(garminRecoveryHours) => onChange({ garminRecoveryHours })} />
              <ProfileField label="VO2 max" value={profile.garminVo2Max} inputMode="decimal" onChange={(garminVo2Max) => onChange({ garminVo2Max })} />
              <ProfileField label="Intensity minutes" value={profile.garminIntensityMinutes} inputMode="numeric" onChange={(garminIntensityMinutes) => onChange({ garminIntensityMinutes })} />
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-[24px] bg-black p-4 text-white dark:bg-white dark:text-black">
            <p className="text-sm opacity-60">Calculated target</p>
            <p className="mt-3 text-5xl font-semibold">{summary.calories || "--"}</p>
            <p className="mt-1 text-sm opacity-60">daily calories · {summary.goalLabel}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Macro label="BMR" value={summary.bmr} unit="kcal" />
            <Macro label="TDEE" value={summary.tdee} unit="kcal" />
            <Macro label="Protein" value={summary.protein} unit="g" />
            <Macro label="Carbs" value={summary.carbs} unit="g" />
            <Macro label="Fat" value={summary.fat} unit="g" />
            <Macro label="BMI" value={summary.bmi} unit="" />
          </div>
          {!summary.isComplete && (
            <div className="rounded-[20px] border border-amber-500/30 bg-amber-500/10 p-3 text-sm leading-6 text-[var(--muted)]">
              Enter age, height, and weight to calculate your targets.
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function RecoveryDashboard({
  chartsReady,
  profileMetrics,
}: {
  chartsReady: boolean;
  profileMetrics: typeof todaysGarminMetrics;
}) {
  const [manualMetrics, setManualMetrics] = useState(profileMetrics);
  const recovery = useMemo(() => calculateRecoveryScore(manualMetrics), [manualMetrics]);
  const positiveFactors = recovery.factors.filter((factor) => factor.impact === "positive");
  const limitingFactors = recovery.factors.filter((factor) => factor.impact !== "positive");

  useEffect(() => {
    setManualMetrics(profileMetrics);
  }, [profileMetrics]);

  function updateMetric(key: keyof typeof manualMetrics, value: number) {
    setManualMetrics((current) => ({ ...current, [key]: value }));
  }

  return (
    <section id="recovery" className="panel scroll-mt-24 rounded-[30px] p-5">
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
  sessions,
  onStartWorkout,
  onImport,
}: {
  planText: string;
  setPlanText: (value: string) => void;
  importedPlan: WorkoutDay[];
  sessions: number;
  onStartWorkout: () => void;
  onImport: () => void;
}) {
  return (
    <section id="workout" className="grid scroll-mt-24 gap-4 2xl:grid-cols-[1fr_420px]">
      <div className="panel rounded-[28px] p-5">
        <SectionTitle icon={Dumbbell} title="Workout tracker" action="Start session" onAction={onStartWorkout} />
        <p className="mt-4 rounded-2xl bg-black/[0.04] p-3 text-sm text-[var(--muted)] dark:bg-white/[0.06]">
          {sessions ? `${sessions} workout session${sessions === 1 ? "" : "s"} started on this device.` : "Start a session to mark today's workout complete."}
        </p>
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
  loggedFoods,
  onLogFood,
  onRemoveFood,
  onEstimate,
}: {
  mealText: string;
  setMealText: (value: string) => void;
  estimates: FoodEstimate[];
  totals: { calories: number; protein: number; carbs: number; fat: number };
  loggedFoods: LoggedFood[];
  onLogFood: (food: FoodEstimate) => void;
  onRemoveFood: (id: string) => void;
  onEstimate: () => void;
}) {
  const loggedTotals = loggedFoods.reduce(
    (acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <section id="nutrition" className="panel scroll-mt-24 rounded-[28px] p-5">
      <SectionTitle icon={Utensils} title="Nutrition tracker" action="Estimate meal" onAction={onEstimate} />
      <div className="mt-5 grid gap-4 xl:grid-cols-[360px_1fr]">
        <div>
          <textarea
            value={mealText}
            onChange={(event) => setMealText(event.target.value)}
            className="min-h-36 w-full resize-none rounded-[20px] border border-[var(--hairline)] bg-transparent p-4 text-sm outline-none"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Macro label="Estimated calories" value={Math.round(totals.calories)} unit="kcal" />
            <Macro label="Estimated protein" value={Math.round(totals.protein)} unit="g" />
            <Macro label="Logged calories" value={Math.round(loggedTotals.calories)} unit="kcal" />
            <Macro label="Logged protein" value={Math.round(loggedTotals.protein)} unit="g" />
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
                <button
                  onClick={() => onLogFood(food)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-black text-white dark:bg-white dark:text-black"
                  aria-label={`Log ${food.name}`}
                >
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
          {loggedFoods.length > 0 && (
            <div className="rounded-[22px] bg-black/[0.04] p-4 dark:bg-white/[0.06]">
              <p className="font-semibold">Today&apos;s logged foods</p>
              <div className="mt-3 space-y-2">
                {loggedFoods.map((food) => (
                  <div key={food.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{food.name}</span>
                    <div className="flex items-center gap-3 text-[var(--muted)]">
                      <span>{food.calories} kcal</span>
                      <button onClick={() => onRemoveFood(food.id)} aria-label={`Remove ${food.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AnalyticsSection({ chartsReady }: { chartsReady: boolean }) {
  return (
    <section id="analytics" className="grid scroll-mt-24 gap-4 xl:grid-cols-2">
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

function RightRail({
  appData,
  onToggleHabit,
}: {
  appData: AppData;
  onToggleHabit: (habit: string) => void;
}) {
  const latestWeight = appData.weights[0]?.value ?? n(appData.profile.weightKg, 0);

  return (
    <aside className="space-y-4">
      <div id="body" className="panel scroll-mt-24 rounded-[28px] p-5">
        <SectionTitle icon={HeartPulse} title="Body and recovery" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Macro label="Weight" value={latestWeight} unit="kg" />
          <Macro label="Body fat" value={n(appData.profile.bodyFatPercent, 0)} unit="%" />
          <Macro label="Sleep avg" value={7.3} unit="h" />
          <Macro label="Photos" value={appData.photos} unit="" />
        </div>
        {appData.journals.length > 0 && (
          <div className="mt-4 rounded-2xl bg-black/[0.04] p-3 dark:bg-white/[0.06]">
            <p className="text-sm font-semibold">Latest journal</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{appData.journals[0].text}</p>
          </div>
        )}
      </div>
      <div id="habits" className="panel scroll-mt-24 rounded-[28px] p-5">
        <SectionTitle icon={CheckCircle2} title="Habits" />
        <div className="mt-5 space-y-3">
          {Object.entries(appData.habits).map(([habit, done]) => (
            <button
              key={habit}
              onClick={() => onToggleHabit(habit)}
              className="flex w-full items-center justify-between rounded-2xl bg-black/[0.04] p-3 text-left dark:bg-white/[0.06]"
            >
              <span className="text-sm">{habit}</span>
              <CheckCircle2 size={18} className={done ? "text-emerald-500" : "text-[var(--muted)]"} />
            </button>
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

function ProfileField({
  label,
  value,
  unit,
  inputMode = "text",
  onChange,
}: {
  label: string;
  value: string;
  unit?: string;
  inputMode?: "text" | "numeric" | "decimal";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-[18px] bg-black/[0.04] p-3 dark:bg-white/[0.06]">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <div className="mt-2 flex items-center rounded-xl border border-[var(--hairline)]">
        <input
          value={value}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
        />
        {unit && <span className="px-3 text-xs text-[var(--muted)]">{unit}</span>}
      </div>
    </label>
  );
}

function ProfileSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-[18px] bg-black/[0.04] p-3 dark:bg-white/[0.06]">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-9 w-full rounded-xl border border-[var(--hairline)] bg-[var(--card-strong)] px-3 text-sm outline-none"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
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
