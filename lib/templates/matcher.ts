export type MatchResult = {
  category: string;
  subcategory: string;
  severity?: string;
  bodyPart?: string;
  templateKey: string;
};

export function matchDiagnosis(diagnosis: string): MatchResult {
  if (diagnosis.includes("esguince") && diagnosis.includes("tobillo")) {
    return {
      category: "traumatology",
      subcategory: "ankle_sprain",
      severity: diagnosis.includes("leve") ? "mild" : "unknown",
      bodyPart: "ankle",
      templateKey: "ankle_sprain_mild"
    };
  }

  if (diagnosis.includes("fractura") && diagnosis.includes("cubito")) {
    return {
      category: "traumatology",
      subcategory: "distal_ulna_fracture",
      severity: diagnosis.includes("no desplazada") ? "non_displaced" : "unknown",
      bodyPart: "forearm",
      templateKey: "distal_ulna_fracture_nondisplaced"
    };
  }

  if (diagnosis.includes("bronquitis")) {
    return {
      category: "respiratory",
      subcategory: "acute_bronchitis",
      severity: "unknown",
      bodyPart: "respiratory_system",
      templateKey: "acute_bronchitis"
    };
  }

  return {
    category: "general_medicine",
    subcategory: "generic_case",
    severity: "unknown",
    bodyPart: "unknown",
    templateKey: "generic_case"
  };
}