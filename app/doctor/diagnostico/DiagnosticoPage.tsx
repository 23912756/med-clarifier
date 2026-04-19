"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type TemplateIndexItem = {
  templateKey: string;
  category: string;
  plainName: string;
};

const CATEGORY_LABELS_ES: Record<string, string> = {
  traumatology: "Traumatologia",
  respiratory: "Respiratorio",
  gastroenterology: "Digestivo",
  dermatology: "Dermatologia",
  pediatrics: "Pediatria",
  general_medicine: "Medicina general",
  cardiology: "Cardiologia",
  neurology: "Neurologia",
  ophthalmology: "Oftalmologia",
  ent: "Otorrinolaringologia",
  urology: "Urologia",
  gynecology: "Ginecologia",
  endocrinology: "Endocrinologia",
  rehabilitation: "Rehabilitacion",
};

type ClinicalTemplate = {
  templateKey: string;
  category: string;
  plainName: string;
  normalSymptoms: string[];
  watchSymptoms: string[];
  alarmSymptoms: string[];
  doList: string[];
  avoidList: string[];
  timeline: Array<{ period: string; text: string }>;
  estimatedRecoveryDays?: number;
  milestones?: Array<{
    startDay: number;
    endDay: number;
    title: string;
    description: string;
  }>;
  recoveryProfile?: {
    kind: "time_based" | "chronic" | "episodic";
    estimatedRecoveryDays?: number;
    milestones?: ClinicalTemplate["milestones"];
    title?: string;
    description?: string;
    reviewEveryDays?: number;
    typicalEpisodeDays?: number;
  };
};

type MedicationItem = {
  drugName: string;
  frequencyPerDay: number;
  durationDays: number;
};

type PdfPayload = {
  patientName: string;
  age: number;
  diagnosis: string;
  templateKey: string;
  recoveryProfile?: {
    kind: "time_based" | "chronic" | "episodic";
    incidentDate?: string;
    estimatedRecoveryDays?: number;
    overrideRecoveryDays?: number;
    milestones?: ClinicalTemplate["milestones"];
    title?: string;
    description?: string;
    reviewEveryDays?: number;
    typicalEpisodeDays?: number;
  };
  summary: string;
  simpleExplanation: string;
  trafficLight: { green: string[]; yellow: string[]; red: string[] };
  recommendations: { do: string[]; avoid: string[] };
  timeline: Array<{ period: string; text: string }>;
  medicationPlan?: MedicationItem[];
};

function splitLines(text: string) {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function joinLines(items: string[]) {
  return items.join("\n");
}

function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function includesAll(hay: string, needles: string[]) {
  return needles.every((n) => hay.includes(n));
}

function buildDefaultPatientText(tpl: ClinicalTemplate) {
  const name = tpl.plainName || "este problema de salud";
  const kind = tpl.recoveryProfile?.kind ?? "time_based";
  const text = norm(`${tpl.plainName} ${tpl.templateKey} ${tpl.category}`);

  const tail =
    "Si aparece algun sintoma de alarma, si empeora de forma clara o si no notas mejoria, consulta.";

  // Keyword-based, body-explaining texts
  if (text.includes("esguince")) {
    return {
      summary: `Esguince: una distension de ligamentos.`,
      explanation:
        `Un esguince significa que los ligamentos (las bandas que sujetan la articulacion) se han estirado o irritado por una torcedura. ` +
        `Por eso aparece dolor, hinchazon y molestia al apoyar o mover. ` +
        `Lo habitual es que el cuerpo lo vaya reparando poco a poco; al principio molesta mas y luego mejora de forma gradual. ` +
        tail
    };
  }

  if (text.includes("fractura")) {
    return {
      summary: `Fractura: un hueso tiene una grieta o rotura.`,
      explanation:
        `Una fractura significa que el hueso tiene una grieta o rotura. ` +
        `Aunque sea "no desplazada", por dentro hay una lesion que necesita tiempo para consolidar. ` +
        `El dolor y la inflamacion son parte de esa reaccion del cuerpo para reparar la zona. ` +
        `Seguir la inmovilizacion y los controles ayuda a que suelde bien. ` +
        tail
    };
  }

  if (includesAll(text, ["bronquitis"]) || text.includes("tos") || text.includes("respiratory")) {
    return {
      summary: `Bronquitis: los bronquios estan irritados e inflamados.`,
      explanation:
        `En una bronquitis, los bronquios (los tubos por donde pasa el aire hacia los pulmones) se irritan e inflaman, casi siempre por un virus. ` +
        `Esa inflamacion hace que aparezca tos y sensacion de opresion o molestia en el pecho. ` +
        `Con descanso e hidratacion suele mejorar de forma progresiva, aunque la tos puede durar algo mas. ` +
        tail
    };
  }

  if (text.includes("reflujo") || text.includes("acidez")) {
    return {
      summary: `Reflujo: el acido del estomago sube mas de lo normal.`,
      explanation:
        `El reflujo ocurre cuando la valvula entre el estomago y el esofago no cierra tan bien como deberia y parte del acido sube. ` +
        `Eso puede causar ardor, regusto amargo o pesadez, sobre todo despues de comer o al tumbarte. ` +
        `Suele mejorar ajustando horarios y comidas, y con el plan que indique tu medico si hace falta. ` +
        tail
    };
  }

  if (text.includes("gastroenteritis") || (text.includes("diarrea") && text.includes("vomit"))) {
    return {
      summary: `Gastroenteritis: el intestino esta irritado.`,
      explanation:
        `En una gastroenteritis, el estomago y el intestino se irritan, a menudo por un virus o algo que ha caido mal. ` +
        `Por eso aparecen diarrea, nausea, vomitos o retortijones: el cuerpo intenta eliminar lo que le irrita. ` +
        `Lo mas importante es evitar deshidratarte y observar la evolucion. ` +
        tail
    };
  }

  if (text.includes("cistitis") || (text.includes("orinar") && text.includes("escozor"))) {
    return {
      summary: `Cistitis: la vejiga esta inflamada o irritada.`,
      explanation:
        `En una cistitis, la vejiga se inflama o se irrita (a veces por una infeccion). ` +
        `Eso hace que aparezca escozor al orinar y ganas frecuentes aunque salga poca cantidad. ` +
        `Con una valoracion se puede confirmar la causa y decidir el plan mas adecuado. ` +
        tail
    };
  }

  if (text.includes("migra") || text.includes("dolor de cabeza")) {
    return {
      summary: `Cefalea: el sistema del dolor se ha activado mas de la cuenta.`,
      explanation:
        `En algunos dolores de cabeza (como la migraña), el sistema que regula el dolor y la sensibilidad se activa mas de lo habitual. ` +
        `Por eso puede doler mas con la luz, el ruido o ciertos esfuerzos, y puede haber nauseas. ` +
        `Suele ir por episodios: a veces dura horas o dias y luego mejora. ` +
        tail
    };
  }

  if (text.includes("diabetes")) {
    return {
      summary: `Diabetes: el azucar en sangre tiende a subir mas de lo normal.`,
      explanation:
        `En la diabetes tipo 2, la insulina (la hormona que ayuda a que el azucar entre en las celulas) no funciona tan bien o no es suficiente. ` +
        `Como resultado, el azucar en sangre puede subir mas de lo normal. ` +
        `El objetivo suele ser control y seguimiento a largo plazo, no una curacion rapida, para prevenir complicaciones. ` +
        tail
    };
  }

  if (text.includes("hipotiroid")) {
    return {
      summary: `Tiroides lenta: se producen menos hormonas tiroideas.`,
      explanation:
        `Cuando hay hipotiroidismo, la tiroides produce menos hormonas de las que el cuerpo necesita. ` +
        `Eso puede hacer que todo vaya "mas lento": cansancio, frio, piel seca o estrenimiento. ` +
        `Con seguimiento y el plan adecuado se suele mejorar el control de sintomas. ` +
        tail
    };
  }

  if (text.includes("hipertiroid")) {
    return {
      summary: `Tiroides acelerada: se producen mas hormonas tiroideas.`,
      explanation:
        `Cuando hay hipertiroidismo, la tiroides produce mas hormonas de lo normal y el cuerpo va "mas rapido". ` +
        `Puede notarse como nervios, palpitaciones, sudoracion o perdida de peso. ` +
        `Con valoracion y seguimiento se ajusta el plan para controlar sintomas. ` +
        tail
    };
  }

  if (text.includes("dermatitis") || text.includes("urticaria") || text.includes("piel")) {
    return {
      summary: `Piel irritada: la barrera de la piel esta reaccionando.`,
      explanation:
        `Cuando la piel se irrita o reacciona (por contacto, alergia o inflamacion), puede enrojecerse, picar y aparecer con ronchas o sequedad. ` +
        `La piel esta actuando como barrera y avisando de que algo la esta molestando. ` +
        `Identificar el desencadenante y cuidar la zona suele ayudar a que se calme. ` +
        tail
    };
  }

  // Fallback by evolution type
  if (kind === "chronic") {
    return {
      summary: `Seguimiento de ${name}.`,
      explanation:
        `En ${name}, el cuerpo no esta funcionando de la forma mas eficiente en algun punto, y por eso aparecen sintomas. ` +
        `En procesos cronicos, lo habitual es trabajar en control y seguimiento para que el dia a dia sea mas llevadero y evitar complicaciones. ` +
        tail
    };
  }

  if (kind === "episodic") {
    return {
      summary: `Episodios de ${name}.`,
      explanation:
        `En ${name}, los sintomas pueden aparecer por episodios: hay periodos de mejoria y otros de empeoramiento. ` +
        `Suele ayudar anotar que lo desencadena y como evoluciona para ajustar el plan con tu medico. ` +
        tail
    };
  }

  return {
    summary: `Diagnostico: ${name}.`,
    explanation:
      `En ${name}, alguna parte del cuerpo esta irritada, inflamada o funcionando peor de lo habitual, y por eso aparecen sintomas. ` +
      `Lo habitual es que el cuerpo vaya recuperandose poco a poco, aunque el ritmo puede variar. ` +
      tail
  };
}

export default function DiagnosticoPage() {
  const [templates, setTemplates] = useState<TemplateIndexItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateKey, setTemplateKey] = useState<string>("");
  const [template, setTemplate] = useState<ClinicalTemplate | null>(null);

  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState<number>(34);
  const [diagnosis, setDiagnosis] = useState("");

  const [summary, setSummary] = useState("");
  const [simpleExplanation, setSimpleExplanation] = useState("");
  const [textTouched, setTextTouched] = useState(false);

  const [incidentDate, setIncidentDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [overrideRecoveryDays, setOverrideRecoveryDays] = useState<number | "">(
    ""
  );
  const [recoveryKind, setRecoveryKind] = useState<
    "time_based" | "chronic" | "episodic"
  >("time_based");

  const [greenText, setGreenText] = useState("");
  const [yellowText, setYellowText] = useState("");
  const [redText, setRedText] = useState("");
  const [doText, setDoText] = useState("");
  const [avoidText, setAvoidText] = useState("");
  const [timelineText, setTimelineText] = useState("");

  const [meds, setMeds] = useState<MedicationItem[]>([]);
  const [medSuggestions, setMedSuggestions] = useState<string[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoadingTemplates(true);
      try {
        const res = await fetch("/api/templates", { cache: "no-store" });
        const json = (await res.json()) as {
          ok: boolean;
          templates: TemplateIndexItem[];
        };
        if (!cancelled) setTemplates(json.templates ?? []);
      } catch {
        if (!cancelled) setTemplates([]);
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setTemplate(null);
      if (!templateKey) return;
      // New template selection: clear AI text and mark as untouched so we can auto-generate.
      setSummary("");
      setSimpleExplanation("");
      setTextTouched(false);
      try {
        const res = await fetch(
          `/api/templates/${encodeURIComponent(templateKey)}`,
          {
            cache: "no-store",
          }
        );
        const json = (await res.json()) as { ok: boolean; template?: ClinicalTemplate };
        if (!cancelled && json.ok && json.template) {
          setTemplate(json.template);
          const nextDiagnosis = json.template.plainName;
          setDiagnosis(nextDiagnosis);
          setGreenText(joinLines(json.template.normalSymptoms));
          setYellowText(joinLines(json.template.watchSymptoms));
          setRedText(joinLines(json.template.alarmSymptoms));
          setDoText(joinLines(json.template.doList));
          setAvoidText(joinLines(json.template.avoidList));
          setTimelineText(
            json.template.timeline.map((t) => `${t.period} | ${t.text}`).join("\n")
          );
          setRecoveryKind(
            (json.template.recoveryProfile?.kind as any) ?? "time_based"
          );

          // Auto-generate patient-friendly text right after selecting template.
          // Only do it if the user hasn't started editing.
          setBusy("Generando texto con IA...");
          setError(null);
          try {
            const resAi = await fetch("/api/ai/patient-text", {
              method: "POST",
              headers: { "Content-Type": "application/json; charset=utf-8" },
              body: JSON.stringify({
                age,
                diagnosis: nextDiagnosis || json.template.templateKey,
                templateKey: json.template.templateKey
              })
            });
            const aiJson = (await resAi.json()) as
              | {
                  ok: true;
                  summary: string;
                  explanation: string;
                  recommendationsDo?: string[];
                  recommendationsAvoid?: string[];
                  trafficGreen?: string[];
                  trafficYellow?: string[];
                  trafficRed?: string[];
                }
              | { ok: false; error: string };
            if (!cancelled && aiJson.ok && !textTouched) {
              setSummary(aiJson.summary ?? "");
              setSimpleExplanation(aiJson.explanation ?? "");
              if (aiJson.recommendationsDo?.length) {
                setDoText(joinLines(aiJson.recommendationsDo));
              }
              if (aiJson.recommendationsAvoid?.length) {
                setAvoidText(joinLines(aiJson.recommendationsAvoid));
              }
              if (aiJson.trafficGreen?.length) {
                setGreenText(joinLines(aiJson.trafficGreen));
              }
              if (aiJson.trafficYellow?.length) {
                setYellowText(joinLines(aiJson.trafficYellow));
              }
              if (aiJson.trafficRed?.length) {
                setRedText(joinLines(aiJson.trafficRed));
              }
            } else if (!cancelled && !aiJson.ok) {
              throw new Error(aiJson.error || "No se pudo generar el texto");
            }
          } catch (e) {
            if (!cancelled) {
              setError(e instanceof Error ? e.message : "Error generando texto con IA");
            }
          } finally {
            if (!cancelled) setBusy(null);
          }
        }
      } catch {
        if (!cancelled) setTemplate(null);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [templateKey]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setMedSuggestions([]);
      if (!templateKey) return;
      try {
        const res = await fetch("/api/med-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            templateKey,
            age,
            diagnosis
          })
        });
        const json = (await res.json()) as
          | { ok: true; suggestions: string[] }
          | { ok: false; error: string };
        if (!cancelled && json.ok) setMedSuggestions(json.suggestions ?? []);
      } catch {
        if (!cancelled) setMedSuggestions([]);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [templateKey, age, diagnosis]);

  const grouped = useMemo(() => {
    const map = new Map<string, TemplateIndexItem[]>();
    for (const t of templates) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [templates]);

  const payload: PdfPayload | null = useMemo(() => {
    if (!templateKey) return null;
    const green = splitLines(greenText);
    const yellow = splitLines(yellowText);
    const red = splitLines(redText);
    const doList = splitLines(doText);
    const avoidList = splitLines(avoidText);
    const timeline = timelineText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [period, ...rest] = line.split("|");
        return { period: (period ?? "").trim(), text: rest.join("|").trim() };
      })
      .filter((t) => t.period && t.text);

    const tplRecovery =
      template?.recoveryProfile?.kind
        ? template.recoveryProfile
        : template?.estimatedRecoveryDays || template?.milestones
          ? {
              kind: "time_based" as const,
              estimatedRecoveryDays: template?.estimatedRecoveryDays,
              milestones: template?.milestones
            }
          : null;

    const effectiveKind = tplRecovery?.kind ?? recoveryKind;

    return {
      patientName: patientName || "Paciente",
      age: Number.isFinite(age) ? age : 0,
      diagnosis: diagnosis || (template?.plainName ?? templateKey),
      templateKey,
      recoveryProfile:
        effectiveKind === "time_based"
          ? {
              kind: "time_based",
              incidentDate,
              estimatedRecoveryDays:
                (tplRecovery as any)?.estimatedRecoveryDays ??
                template?.estimatedRecoveryDays ??
                14,
              overrideRecoveryDays:
                overrideRecoveryDays === ""
                  ? undefined
                  : Number(overrideRecoveryDays),
              milestones: (tplRecovery as any)?.milestones ?? template?.milestones
            }
          : effectiveKind === "chronic"
            ? {
                kind: "chronic",
                incidentDate,
                title: (tplRecovery as any)?.title ?? "Seguimiento",
                description:
                  (tplRecovery as any)?.description ??
                  "Proceso cronico o de control. Se recomienda seguimiento segun indicacion clinica.",
                reviewEveryDays: (tplRecovery as any)?.reviewEveryDays
              }
            : {
                kind: "episodic",
                incidentDate,
                title: (tplRecovery as any)?.title ?? "Episodios",
                description:
                  (tplRecovery as any)?.description ??
                  "Evolucion por episodios. La duracion y frecuencia pueden variar.",
                typicalEpisodeDays: (tplRecovery as any)?.typicalEpisodeDays
              },
      summary,
      simpleExplanation,
      trafficLight: { green, yellow, red },
      recommendations: { do: doList, avoid: avoidList },
      timeline,
      medicationPlan: meds.length ? meds : undefined
    };
  }, [
    age,
    avoidText,
    diagnosis,
    doText,
    greenText,
    incidentDate,
    meds,
    overrideRecoveryDays,
    patientName,
    recoveryKind,
    redText,
    simpleExplanation,
    summary,
    template,
    templateKey,
    timelineText,
    yellowText
  ]);

  async function previewPdf() {
    if (!payload) return;
    setBusy("Generando PDF...");
    setError(null);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando PDF");
    } finally {
      setBusy(null);
    }
  }

  async function downloadPdf() {
    if (!payload) return;
    setBusy("Descargando PDF...");
    setError(null);
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safe = (payload.patientName || "paciente")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-_]/g, "")
        .toLowerCase();
      a.download = `ficha-${safe || "paciente"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error descargando PDF");
    } finally {
      setBusy(null);
    }
  }

  async function generateAiText() {
    if (!templateKey) return;
    setBusy("Generando texto con IA...");
    setError(null);
    try {
      const res = await fetch("/api/ai/patient-text", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          age,
          diagnosis: diagnosis || (template?.plainName ?? templateKey),
          templateKey,
        }),
      });
      const json = (await res.json()) as
        | {
            ok: true;
            summary: string;
            explanation: string;
            recommendationsDo?: string[];
            recommendationsAvoid?: string[];
            trafficGreen?: string[];
            trafficYellow?: string[];
            trafficRed?: string[];
          }
        | { ok: false; error: string };
      if (!json.ok) throw new Error(json.error || "No se pudo generar el texto");
      setSummary(json.summary);
      setSimpleExplanation(json.explanation);
      if (json.recommendationsDo?.length) {
        setDoText(joinLines(json.recommendationsDo));
      }
      if (json.recommendationsAvoid?.length) {
        setAvoidText(joinLines(json.recommendationsAvoid));
      }
      if (json.trafficGreen?.length) {
        setGreenText(joinLines(json.trafficGreen));
      }
      if (json.trafficYellow?.length) {
        setYellowText(joinLines(json.trafficYellow));
      }
      if (json.trafficRed?.length) {
        setRedText(joinLines(json.trafficRed));
      }
      setTextTouched(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando texto con IA");
    } finally {
      setBusy(null);
    }
  }

  function addMed() {
    setMeds((m) => [...m, { drugName: "", frequencyPerDay: 2, durationDays: 7 }]);
  }

  function addSuggestedMed(name: string) {
    setMeds((m) => [...m, { drugName: name, frequencyPerDay: 2, durationDays: 7 }]);
  }

  function updateMed(idx: number, patch: Partial<MedicationItem>) {
    setMeds((m) => m.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }

  function removeMed(idx: number) {
    setMeds((m) => m.filter((_, i) => i !== idx));
  }

  return (
    <div className="min-h-full clarifier-bg bg-zinc-50 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
              <Image
                src="/clarifier-mark.svg"
                alt="Clarifier"
                width={34}
                height={34}
                priority
              />
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Clarifier
                </h1>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                  Clinica
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Selecciona una plantilla, ajusta el texto y genera una ficha PDF
                clara para el paciente.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={previewPdf}
              disabled={!payload || !!busy}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              Previsualizar PDF
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={!payload || !!busy}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
            >
              Confirmar y descargar
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Paciente</span>
                <input
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-0 transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Nombre y apellidos"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Edad</span>
                <input
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  min={0}
                  max={120}
                />
              </label>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Fecha de incidencia</span>
                  <input
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Tipo de evolucion</span>
                  <select
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    value={recoveryKind}
                    onChange={(e) =>
                      setRecoveryKind(e.target.value as "time_based" | "chronic" | "episodic")
                    }
                  >
                    <option value="time_based">Recuperacion por dias</option>
                    <option value="chronic">Cronico / seguimiento</option>
                    <option value="episodic">Por episodios</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Duracion (dias) opcional</span>
                  <input
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    type="number"
                    min={1}
                    max={365}
                    value={overrideRecoveryDays}
                    onChange={(e) =>
                      setOverrideRecoveryDays(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    placeholder={String(template?.estimatedRecoveryDays ?? 14)}
                    disabled={recoveryKind !== "time_based"}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Enfermedad / plantilla</span>
                <select
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                >
                  <option value="" disabled>
                    {loadingTemplates ? "Cargando..." : "Selecciona una plantilla"}
                  </option>
                  {grouped.map(([cat, items]) => (
                    <optgroup key={cat} label={CATEGORY_LABELS_ES[cat] ?? cat}>
                      {items.map((t) => (
                        <option key={t.templateKey} value={t.templateKey}>
                          {t.plainName}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Diagnostico (texto)</span>
                <input
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Texto libre que aparecera en la ficha"
                />
              </label>
            </div>

            <div className="mt-6 border-t border-zinc-200/60 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Texto editable</h2>
                <button
                  type="button"
                  onClick={generateAiText}
                  disabled={!templateKey || !!busy}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold shadow-sm hover:bg-zinc-50 disabled:opacity-50"
                >
                  Regenerar con IA
                </button>
              </div>

              <label className="mt-3 flex flex-col gap-1">
                <span className="text-sm font-medium">Resumen</span>
                <textarea
                  className="min-h-16 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    setTextTouched(true);
                  }}
                  placeholder={templateKey ? "Generando..." : "Selecciona una plantilla"}
                />
              </label>

              <label className="mt-3 flex flex-col gap-1">
                <span className="text-sm font-medium">Explicacion sencilla</span>
                <textarea
                  className="min-h-24 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                  value={simpleExplanation}
                  onChange={(e) => {
                    setSimpleExplanation(e.target.value);
                    setTextTouched(true);
                  }}
                  placeholder={templateKey ? "Se generará al seleccionar la plantilla" : "Selecciona una plantilla"}
                />
              </label>
            </div>

            <div className="mt-6 border-t border-zinc-200/60 pt-5">
              <h2 className="text-sm font-semibold">Semaforo</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Normal</span>
                  <textarea
                    className="min-h-28 rounded-xl border border-emerald-200 bg-emerald-50/40 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
                    value={greenText}
                    onChange={(e) => setGreenText(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Vigilar</span>
                  <textarea
                    className="min-h-28 rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
                    value={yellowText}
                    onChange={(e) => setYellowText(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Consultar</span>
                  <textarea
                    className="min-h-28 rounded-xl border border-rose-200 bg-rose-50/40 px-3 py-2 text-sm shadow-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                    value={redText}
                    onChange={(e) => setRedText(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-200/60 pt-5">
              <h2 className="text-sm font-semibold">Recomendaciones</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Que hacer</span>
                  <textarea
                    className="min-h-28 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    value={doText}
                    onChange={(e) => setDoText(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Que evitar</span>
                  <textarea
                    className="min-h-28 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    value={avoidText}
                    onChange={(e) => setAvoidText(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 border-t border-zinc-200/60 pt-5">
              <h2 className="text-sm font-semibold">Timeline</h2>
              <p className="mt-1 text-xs text-zinc-600">
                Una linea por item: <span className="font-mono">Periodo | texto</span>
              </p>
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                value={timelineText}
                onChange={(e) => setTimelineText(e.target.value)}
              />
            </div>

            <div className="mt-6 border-t border-zinc-200/60 pt-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Medicacion</h2>
                <button
                  type="button"
                  onClick={addMed}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-zinc-50"
                >
                  Anadir
                </button>
              </div>

              {medSuggestions.length ? (
                <div className="mt-3">
                  <div className="text-xs font-medium text-zinc-600">
                    Sugerencias rapidas
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {medSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => addSuggestedMed(s)}
                        className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold shadow-sm hover:bg-zinc-50"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Sugerencias de farmacos (sin dosis). El medico decide.
                  </div>
                </div>
              ) : null}

              {meds.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-600">Sin medicacion (opcional).</p>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  {meds.map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
                    >
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <label className="flex flex-col gap-1 md:col-span-2">
                          <span className="text-xs font-medium text-zinc-700">
                            Medicamento
                          </span>
                          <input
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                            value={m.drugName}
                            onChange={(e) => updateMed(idx, { drugName: e.target.value })}
                            placeholder="Ej: ibuprofeno"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-zinc-700">
                            Tomas/dia
                          </span>
                          <input
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                            type="number"
                            min={1}
                            max={6}
                            value={m.frequencyPerDay}
                            onChange={(e) =>
                              updateMed(idx, { frequencyPerDay: Number(e.target.value) })
                            }
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-zinc-700">Dias</span>
                          <input
                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                            type="number"
                            min={1}
                            max={31}
                            value={m.durationDays}
                            onChange={(e) =>
                              updateMed(idx, { durationDays: Number(e.target.value) })
                            }
                          />
                        </label>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeMed(idx)}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-zinc-50"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error ? (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-zinc-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Previsualizacion</h2>
              {pdfUrl ? (
                <button
                  type="button"
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-zinc-50"
                  onClick={() => {
                    setPdfUrl((old) => {
                      if (old) URL.revokeObjectURL(old);
                      return null;
                    });
                  }}
                >
                  Cerrar
                </button>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              Genera una previsualizacion para revisar antes de confirmar.
            </p>

            {pdfUrl ? (
              <iframe
                title="pdf-preview"
                className="mt-4 h-[75vh] w-full rounded-2xl border border-zinc-200 bg-white shadow-sm"
                src={pdfUrl}
              />
            ) : (
              <div className="mt-4 flex h-[75vh] items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/40 text-sm text-zinc-600">
                Sin previsualizacion aun.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

