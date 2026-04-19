-- CreateTable
CREATE TABLE "PatientCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "rawDiagnosis" TEXT NOT NULL,
    "doctorNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "DiagnosisInterpretation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT NOT NULL,
    "severity" TEXT,
    "bodyPart" TEXT,
    "templateKey" TEXT NOT NULL,
    CONSTRAINT "DiagnosisInterpretation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "PatientCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "structuredJson" TEXT NOT NULL,
    "html" TEXT,
    "pdfPath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    CONSTRAINT "GeneratedDocument_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "PatientCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicationPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "drugName" TEXT NOT NULL,
    "dose" TEXT,
    "frequency" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    CONSTRAINT "MedicationPlan_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "PatientCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosisInterpretation_caseId_key" ON "DiagnosisInterpretation"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocument_caseId_key" ON "GeneratedDocument"("caseId");
