import { openai } from "@/lib/ai/openai";
import { z } from "zod";

const aiTextSchema = z.object({
  summary: z.string().min(1),
  explanation: z.string().min(1),
  recommendationsDo: z.array(z.string()).min(2).max(6),
  recommendationsAvoid: z.array(z.string()).min(2).max(6),
  trafficGreen: z.array(z.string()).min(2).max(6),
  trafficYellow: z.array(z.string()).min(2).max(6),
  trafficRed: z.array(z.string()).min(2).max(6)
});

export async function generatePatientExplanation(input: {
  diagnosis: string;
  templateName: string;
  age: number;
}) {
  const response = await openai.responses.create({
    model: "gpt-5.4",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Eres un medico que explica diagnosticos a pacientes de forma clara, sencilla y tranquilizadora. " +
              "No uses lenguaje tecnico complejo. No alarmes. No inventes datos."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Paciente de ${input.age} años.\n` +
              `Diagnostico: ${input.diagnosis}\n` +
              `Tipo: ${input.templateName}\n\n` +
              "Escribe:\n" +
              "1. Un resumen corto (1 frase)\n" +
              "2. Una explicacion clara para el paciente (3-4 lineas)\n" +
              "3. Recomendaciones de que hacer (2-5 items)\n" +
              "4. Recomendaciones de que evitar (2-5 items)\n\n" +
              "5. Semaforo - Normal (2-5 items)\n" +
              "6. Semaforo - Vigilar (2-5 items)\n" +
              "7. Semaforo - Consultar urgente (2-5 items)\n\n" +
              "Tono: claro, practico, sin alarmismo. Personaliza por edad y diagnostico.\n\n" +
              "Devuelve JSON:\n" +
              "{ summary: string, explanation: string, recommendationsDo: string[], recommendationsAvoid: string[], trafficGreen: string[], trafficYellow: string[], trafficRed: string[] }"
          }
        ]
      }
    ]
  });

  let raw: unknown = {};
  try {
    raw = JSON.parse(response.output_text ?? "{}");
  } catch {
    raw = {};
  }
  const parsed = aiTextSchema.safeParse(raw);
  if (parsed.success) return parsed.data;

  // Fallback defensive shape in case the model misses list fields.
  const fallback = {
    summary: "",
    explanation: "",
    recommendationsDo: [] as string[],
    recommendationsAvoid: [] as string[],
    trafficGreen: [] as string[],
    trafficYellow: [] as string[],
    trafficRed: [] as string[]
  };
  const maybe = raw as any;
  fallback.summary = String(maybe.summary ?? "").trim();
  fallback.explanation = String(maybe.explanation ?? "").trim();
  fallback.recommendationsDo = Array.isArray(maybe.recommendationsDo)
    ? maybe.recommendationsDo.map((x: unknown) => String(x).trim()).filter(Boolean)
    : [];
  fallback.recommendationsAvoid = Array.isArray(maybe.recommendationsAvoid)
    ? maybe.recommendationsAvoid.map((x: unknown) => String(x).trim()).filter(Boolean)
    : [];
  fallback.trafficGreen = Array.isArray(maybe.trafficGreen)
    ? maybe.trafficGreen.map((x: unknown) => String(x).trim()).filter(Boolean)
    : [];
  fallback.trafficYellow = Array.isArray(maybe.trafficYellow)
    ? maybe.trafficYellow.map((x: unknown) => String(x).trim()).filter(Boolean)
    : [];
  fallback.trafficRed = Array.isArray(maybe.trafficRed)
    ? maybe.trafficRed.map((x: unknown) => String(x).trim()).filter(Boolean)
    : [];
  return fallback;
}