export type RecoveryMilestone = {
  startDay: number;
  endDay: number;
  title: string;
  description: string;
};

export type RecoveryProgress = {
  incidentDate: string; // YYYY-MM-DD
  estimatedRecoveryDate: string; // YYYY-MM-DD
  daysElapsed: number;
  totalDays: number;
  progressPercent: number;
  isCompleted: boolean;
  currentPhase: string;
  currentMilestone: RecoveryMilestone | null;
  nextMilestone: RecoveryMilestone | null;
  upcomingMilestones: RecoveryMilestone[];
};

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function toYyyyMmDd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseYyyyMmDd(input: string) {
  // interpret as local date
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const da = Number(m[3]);
  const d = new Date(y, mo - 1, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== da)
    return null;
  return d;
}

function addDays(d: Date, days: number) {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

function diffDays(from: Date, to: Date) {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

function normalizeMilestones(milestones: RecoveryMilestone[]) {
  return milestones
    .map((m) => ({
      ...m,
      startDay: Math.max(0, Math.floor(m.startDay)),
      endDay: Math.max(0, Math.floor(m.endDay)),
      title: String(m.title ?? "").trim(),
      description: String(m.description ?? "").trim()
    }))
    .filter((m) => m.title && m.description && m.endDay >= m.startDay)
    .sort((a, b) => a.startDay - b.startDay);
}

export function calculateRecoveryProgress(input: {
  incidentDate: string; // YYYY-MM-DD
  estimatedRecoveryDays: number;
  milestones: RecoveryMilestone[];
  currentDate?: string; // YYYY-MM-DD
}): RecoveryProgress {
  const now = input.currentDate ? (parseYyyyMmDd(input.currentDate) ?? new Date()) : new Date();
  const incident = parseYyyyMmDd(input.incidentDate) ?? new Date();

  const totalDays = Math.max(1, Math.floor(input.estimatedRecoveryDays || 1));
  const estimatedRecovery = addDays(incident, totalDays);

  const daysElapsedRaw = diffDays(incident, now);
  const daysElapsed = Math.max(0, daysElapsedRaw);

  const progress = clamp(daysElapsed / totalDays, 0, 1);
  const progressPercent = Math.round(progress * 100);
  const isCompleted = daysElapsed >= totalDays;

  const ms = normalizeMilestones(input.milestones ?? []);
  const dayIndex = clamp(daysElapsed, 0, totalDays);

  const currentMilestone =
    ms.find((m) => dayIndex >= m.startDay && dayIndex <= m.endDay) ?? null;
  const nextMilestone =
    ms.find((m) => m.startDay > dayIndex) ??
    ms.find((m) => m.endDay > dayIndex) ??
    null;

  const upcomingMilestones = ms.filter((m) => m.startDay > dayIndex).slice(0, 3);

  const currentPhase =
    daysElapsedRaw < 0
      ? "Fecha de incidencia en el futuro (revisar)"
      : isCompleted
        ? "Recuperacion estimada completada"
        : currentMilestone?.title ?? "Recuperacion en curso";

  return {
    incidentDate: toYyyyMmDd(incident),
    estimatedRecoveryDate: toYyyyMmDd(estimatedRecovery),
    daysElapsed,
    totalDays,
    progressPercent,
    isCompleted,
    currentPhase,
    currentMilestone,
    nextMilestone,
    upcomingMilestones
  };
}

