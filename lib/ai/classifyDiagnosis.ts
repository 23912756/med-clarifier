import { z } from "zod";
import { openai } from "@/lib/ai/openai";
import { matchDiagnosis } from "@/lib/templates/matcher";

export const diagnosisClassificationSchema = z.object({
  category: z.string().min(1),
  subcategory: z.string().min(1),
  severity: z.string().optional(),
  bodyPart: z.string().optional(),
  templateKey: z.string().min(1)
});

export type DiagnosisClassification = z.infer<
  typeof diagnosisClassificationSchema
>;

export async function classifyDiagnosisWithAI(input: {
  age: number;
  diagnosis: string;
}): Promise<DiagnosisClassification> {
  const response = await openai.responses.create({
    model: "gpt-5.4",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "Eres un clasificador clinico asistencial. " +
              "No diagnosticas ni das consejos. " +
              "Solo clasificas un diagnostico breve usando un conjunto cerrado de valores. " +
              "Debes responder unicamente con JSON valido."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Edad del paciente: ${input.age}\n` +
              `Diagnostico breve: ${input.diagnosis}\n\n` +
              "Devuelve JSON con estas claves exactas:\n" +
              "- category\n" +
              "- subcategory\n" +
              "- severity\n" +
              "- bodyPart\n" +
              "- templateKey\n\n" +
              "Reglas:\n" +
              "- templateKey debe ser un identificador en minusculas con guion bajo (ej: ankle_sprain_mild)\n" +
              "- category debe ser el nombre de la carpeta (ej: traumatology, respiratory, general_medicine)\n" +
              "- Si no estas seguro, usa category=general_medicine, subcategory=generic_case y templateKey=generic_case\n" +
              "- Debes responder unicamente con JSON valido, sin texto adicional."
          }
        ]
      }
    ]
  });

  const text = response.output_text;
  try {
    const parsed = JSON.parse(text);
    const validated = diagnosisClassificationSchema.safeParse(parsed);
    if (validated.success) return validated.data;
  } catch {
    // ignore and fallback
  }

  const fallback = matchDiagnosis(input.diagnosis);
  return diagnosisClassificationSchema.parse({
    category: fallback.category || "general_medicine",
    subcategory: fallback.subcategory || "generic_case",
    severity: fallback.severity ?? "unknown",
    bodyPart: fallback.bodyPart ?? "unknown",
    templateKey: fallback.templateKey || "generic_case"
  });
}