import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.PDF_API_BASE_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(__dirname, "output");

const traffic = {
  green: ["Molestia leve", "Tolera liquidos", "Sin fiebre alta"],
  yellow: ["Dolor que no mejora", "Empeora al esfuerzo", "Malestar persistente"],
  red: ["Fiebre alta mantenida", "Dificultad para respirar", "Dolor muy intenso"]
};

const recommendations = {
  do: ["Descanso relativo", "Hidratacion frecuente", "Seguir indicaciones medicas"],
  avoid: ["Esfuerzos intensos", "Automedicacion sin criterio", "Saltarse pautas"]
};

const timeline = [
  { period: "0-3 dias", text: "Control de sintomas y reposo relativo." },
  { period: "4-10 dias", text: "Mejora progresiva en la mayoria de casos." },
  { period: "11-21 dias", text: "Recuperacion funcional gradual." }
];

const samples = [
  {
    fileName: "01-ana-lopez-reflujo.pdf",
    patientName: "Ana Lopez",
    age: 34,
    diagnosis: "Reflujo gastroesofagico",
    templateKey: "reflux_symptoms",
    meds: [{ drugName: "omeprazol", frequencyPerDay: 1, durationDays: 14 }]
  },
  {
    fileName: "02-carlos-mendez-bronquitis.pdf",
    patientName: "Carlos Mendez",
    age: 46,
    diagnosis: "Bronquitis aguda",
    templateKey: "acute_bronchitis",
    meds: [
      { drugName: "paracetamol", frequencyPerDay: 3, durationDays: 5 },
      { drugName: "dextrometorfano", frequencyPerDay: 2, durationDays: 5 }
    ]
  },
  {
    fileName: "03-lucia-garcia-esguince.pdf",
    patientName: "Lucia Garcia",
    age: 29,
    diagnosis: "Esguince de tobillo leve",
    templateKey: "ankle_sprain_mild",
    meds: [{ drugName: "ibuprofeno", frequencyPerDay: 2, durationDays: 7 }]
  },
  {
    fileName: "04-jorge-martin-migrana.pdf",
    patientName: "Jorge Martin",
    age: 38,
    diagnosis: "Migraña sospechada",
    templateKey: "migraine_suspected",
    meds: [
      { drugName: "naproxeno", frequencyPerDay: 2, durationDays: 4 },
      { drugName: "metoclopramida", frequencyPerDay: 2, durationDays: 3 }
    ]
  },
  {
    fileName: "05-marta-ruiz-cistitis.pdf",
    patientName: "Marta Ruiz",
    age: 41,
    diagnosis: "Cistitis no complicada",
    templateKey: "uncomplicated_cystitis_symptoms",
    meds: [{ drugName: "fosfomicina", frequencyPerDay: 1, durationDays: 2 }]
  },
  {
    fileName: "06-pedro-santos-lumbalgia.pdf",
    patientName: "Pedro Santos",
    age: 52,
    diagnosis: "Lumbalgia mecanica",
    templateKey: "mechanical_low_back_pain",
    meds: [
      { drugName: "paracetamol", frequencyPerDay: 3, durationDays: 7 },
      { drugName: "diclofenaco topico", frequencyPerDay: 2, durationDays: 10 }
    ]
  },
  {
    fileName: "07-elena-navarro-hipotiroidismo.pdf",
    patientName: "Elena Navarro",
    age: 50,
    diagnosis: "Sintomas compatibles con hipotiroidismo",
    templateKey: "hypothyroid_symptoms",
    meds: [{ drugName: "levotiroxina", frequencyPerDay: 1, durationDays: 30 }]
  },
  {
    fileName: "08-raul-vega-conjuntivitis.pdf",
    patientName: "Raul Vega",
    age: 27,
    diagnosis: "Conjuntivitis leve",
    templateKey: "conjunctivitis_mild",
    meds: [{ drugName: "lagrimas artificiales", frequencyPerDay: 4, durationDays: 7 }]
  },
  {
    fileName: "09-nerea-diaz-gastroenteritis.pdf",
    patientName: "Nerea Diaz",
    age: 31,
    diagnosis: "Gastroenteritis aguda leve",
    templateKey: "acute_gastroenteritis_mild",
    meds: [
      { drugName: "solucion de rehidratacion oral", frequencyPerDay: 4, durationDays: 3 },
      { drugName: "paracetamol", frequencyPerDay: 3, durationDays: 3 }
    ]
  },
  {
    fileName: "10-diego-romero-urticaria.pdf",
    patientName: "Diego Romero",
    age: 36,
    diagnosis: "Urticaria leve",
    templateKey: "urticaria_mild",
    meds: [{ drugName: "loratadina", frequencyPerDay: 1, durationDays: 7 }]
  },
  {
    fileName: "11-paula-ibanez-sinusitis.pdf",
    patientName: "Paula Ibanez",
    age: 33,
    diagnosis: "Congestion sinusal",
    templateKey: "sinus_congestion",
    meds: [
      { drugName: "lavado nasal salino", frequencyPerDay: 3, durationDays: 7 },
      { drugName: "paracetamol", frequencyPerDay: 3, durationDays: 4 }
    ]
  },
  {
    fileName: "12-marcos-ortega-cervicalgia.pdf",
    patientName: "Marcos Ortega",
    age: 44,
    diagnosis: "Dolor cervical inespecifico",
    templateKey: "nonspecific_neck_pain",
    meds: [
      { drugName: "ibuprofeno", frequencyPerDay: 2, durationDays: 5 },
      { drugName: "calor local", frequencyPerDay: 2, durationDays: 7 }
    ]
  },
  {
    fileName: "13-irene-castro-conjuntiva-seca.pdf",
    patientName: "Irene Castro",
    age: 39,
    diagnosis: "Sindrome de ojo seco",
    templateKey: "dry_eye_symptoms",
    meds: [{ drugName: "lagrimas artificiales", frequencyPerDay: 5, durationDays: 14 }]
  },
  {
    fileName: "14-andres-lozano-vertigo.pdf",
    patientName: "Andres Lozano",
    age: 48,
    diagnosis: "Vertigo benigno periferico",
    templateKey: "benign_vertigo",
    meds: [{ drugName: "betahistina", frequencyPerDay: 2, durationDays: 7 }]
  },
  {
    fileName: "15-sara-prieto-estrenimiento.pdf",
    patientName: "Sara Prieto",
    age: 30,
    diagnosis: "Estrenimiento leve",
    templateKey: "constipation_mild",
    meds: [
      { drugName: "lactulosa", frequencyPerDay: 1, durationDays: 7 },
      { drugName: "fibra soluble", frequencyPerDay: 1, durationDays: 14 }
    ]
  },
  {
    fileName: "16-hugo-salinas-ansiedad.pdf",
    patientName: "Hugo Salinas",
    age: 27,
    diagnosis: "Sintomas de ansiedad y estres",
    templateKey: "anxiety_stress_symptoms",
    meds: [{ drugName: "melatonina", frequencyPerDay: 1, durationDays: 10 }]
  },
  {
    fileName: "17-alba-moreno-blefaritis.pdf",
    patientName: "Alba Moreno",
    age: 35,
    diagnosis: "Blefaritis leve",
    templateKey: "blepharitis_mild",
    meds: [
      { drugName: "higiene palpebral", frequencyPerDay: 2, durationDays: 14 },
      { drugName: "lagrimas artificiales", frequencyPerDay: 4, durationDays: 10 }
    ]
  },
  {
    fileName: "18-daniel-cano-laringitis.pdf",
    patientName: "Daniel Cano",
    age: 42,
    diagnosis: "Disfonia por laringitis",
    templateKey: "hoarseness_laryngitis",
    meds: [{ drugName: "paracetamol", frequencyPerDay: 3, durationDays: 3 }]
  },
  {
    fileName: "19-noelia-gil-epicondilitis.pdf",
    patientName: "Noelia Gil",
    age: 37,
    diagnosis: "Epicondilitis lateral (codo de tenista)",
    templateKey: "tennis_elbow_epicondylitis",
    meds: [
      { drugName: "naproxeno", frequencyPerDay: 2, durationDays: 5 },
      { drugName: "reposo relativo", frequencyPerDay: 1, durationDays: 10 }
    ]
  },
  {
    fileName: "20-victor-fuentes-faringitis.pdf",
    patientName: "Victor Fuentes",
    age: 25,
    diagnosis: "Faringitis viral",
    templateKey: "viral_sore_throat",
    meds: [
      { drugName: "paracetamol", frequencyPerDay: 3, durationDays: 4 },
      { drugName: "ibuprofeno", frequencyPerDay: 2, durationDays: 3 }
    ]
  }
];

function buildPayload(sample) {
  const diagnosis = sample.diagnosis;
  return {
    patientName: sample.patientName,
    age: sample.age,
    diagnosis,
    templateKey: sample.templateKey,
    summary: "",
    simpleExplanation: "",
    trafficLight: traffic,
    recommendations,
    timeline,
    medicationPlan: sample.meds
  };
}

async function generateAiText(sample) {
  const res = await fetch(`${BASE_URL}/api/ai/patient-text`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      age: sample.age,
      diagnosis: sample.diagnosis,
      templateKey: sample.templateKey
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`IA ${sample.fileName} fallo (${res.status}): ${errText}`);
  }

  const json = await res.json();
  if (!json?.ok) {
    throw new Error(`IA ${sample.fileName} fallo: ${json?.error || "error desconocido"}`);
  }

  return {
    summary: String(json.summary ?? "").trim(),
    explanation: String(json.explanation ?? "").trim(),
    recommendationsDo: Array.isArray(json.recommendationsDo)
      ? json.recommendationsDo.map((x) => String(x).trim()).filter(Boolean)
      : [],
    recommendationsAvoid: Array.isArray(json.recommendationsAvoid)
      ? json.recommendationsAvoid.map((x) => String(x).trim()).filter(Boolean)
      : [],
    trafficGreen: Array.isArray(json.trafficGreen)
      ? json.trafficGreen.map((x) => String(x).trim()).filter(Boolean)
      : [],
    trafficYellow: Array.isArray(json.trafficYellow)
      ? json.trafficYellow.map((x) => String(x).trim()).filter(Boolean)
      : [],
    trafficRed: Array.isArray(json.trafficRed)
      ? json.trafficRed.map((x) => String(x).trim()).filter(Boolean)
      : []
  };
}

async function generateOne(sample, index, total) {
  const payload = buildPayload(sample);
  const aiText = await generateAiText(sample);
  payload.summary = aiText.summary;
  payload.simpleExplanation = aiText.explanation;
  payload.recommendations = {
    do: aiText.recommendationsDo.length ? aiText.recommendationsDo : recommendations.do,
    avoid: aiText.recommendationsAvoid.length
      ? aiText.recommendationsAvoid
      : recommendations.avoid
  };
  payload.trafficLight = {
    green: aiText.trafficGreen.length ? aiText.trafficGreen : traffic.green,
    yellow: aiText.trafficYellow.length ? aiText.trafficYellow : traffic.yellow,
    red: aiText.trafficRed.length ? aiText.trafficRed : traffic.red
  };

  const res = await fetch(`${BASE_URL}/api/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`PDF ${sample.fileName} fallo (${res.status}): ${errText}`);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  const outPath = path.join(OUTPUT_DIR, sample.fileName);
  await writeFile(outPath, bytes);
  console.log(
    `[${index}/${total}] OK -> ${sample.fileName} (${bytes.length} bytes) [AI text included]`
  );
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  console.log(`Generando ${samples.length} PDFs en: ${OUTPUT_DIR}`);
  console.log(`Usando APIs: ${BASE_URL}/api/ai/patient-text + ${BASE_URL}/api/pdf`);

  for (let i = 0; i < samples.length; i += 1) {
    await generateOne(samples[i], i + 1, samples.length);
  }

  console.log("Listo. Ya tienes 10 PDFs de muestra.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
