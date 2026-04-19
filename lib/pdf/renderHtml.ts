type GeneratedContent = {
  patientName: string;
  age: number;
  diagnosis: string;
  normalizedDiagnosis?: string;
  templateKey: string;
  incidentDate?: string;
  estimatedRecoveryDays?: number;
  overrideRecoveryDays?: number;
  summary: string;
  simpleExplanation: string;
  recovery?: {
    incidentDate: string;
    estimatedRecoveryDate: string;
    daysElapsed: number;
    totalDays: number;
    progressPercent: number;
    isCompleted: boolean;
    currentPhase: string;
    currentMilestone: { startDay: number; endDay: number; title: string; description: string } | null;
    nextMilestone: { startDay: number; endDay: number; title: string; description: string } | null;
    upcomingMilestones: Array<{ startDay: number; endDay: number; title: string; description: string }>;
  };
  medicationPlan?: Array<{
    drugName: string;
    frequencyPerDay: number;
    durationDays: number;
  }>;
  trafficLight: {
    green: string[];
    yellow: string[];
    red: string[];
  };
  recommendations: {
    do: string[];
    avoid: string[];
  };
  timeline: Array<{
    period: string;
    text: string;
  }>;
};

function renderList(items: string[]) {
  return items.map((item) => `<li>${item}</li>`).join("");
}

function renderTimeline(
  items: Array<{
    period: string;
    text: string;
  }>
) {
  return items
    .map(
      (item) => `
        <div class="timeline-item">
          <div class="timeline-period">${item.period}</div>
          <div class="timeline-text">${item.text}</div>
        </div>
      `
    )
    .join("");
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMedicationTable(med: {
  drugName: string;
  frequencyPerDay: number;
  durationDays: number;
}) {
  const days = Math.min(Math.max(med.durationDays, 1), 31);
  const doses = Math.min(Math.max(med.frequencyPerDay, 1), 6);

  const headCells = Array.from({ length: days }, (_, i) => `<th>${i + 1}</th>`).join(
    ""
  );
  const rows = Array.from({ length: doses }, (_, r) => {
    const cells = Array.from({ length: days }, () => `<td class="dose-cell"></td>`).join(
      ""
    );
    return `<tr><th class="row-head">${r + 1}</th>${cells}</tr>`;
  }).join("");

  return `
    <div class="med-block">
      <div class="med-title">${escapeHtml(med.drugName)} (${doses} tomas/dia, ${days} dias)</div>
      <div class="med-table-wrap">
        <table class="med-table">
          <thead>
            <tr>
              <th class="corner">Toma</th>
              ${headCells}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
      <div class="med-note">Marque una casilla cada vez que se tome la medicacion.</div>
    </div>
  `;
}

function renderDailyProgressGrid(totalDays: number, daysElapsed: number) {
  const cols = 14;
  const t = Math.min(Math.max(Math.floor(totalDays), 1), 365);
  const elapsed = Math.min(Math.max(Math.floor(daysElapsed), 0), t);

  const rows = Math.ceil(t / cols);
  const header = Array.from({ length: cols }, (_, i) => `<th>${i + 1}</th>`).join("");

  const body = Array.from({ length: rows }, (_, r) => {
    const start = r * cols + 1;
    const cells = Array.from({ length: cols }, (_, c) => {
      const day = start + c;
      if (day > t) return `<td class="day-cell day-empty"></td>`;
      const percent = Math.round((day / t) * 100);
      const isDone = day <= elapsed;
      const isToday = day === Math.min(elapsed + 1, t) && elapsed < t;
      const classes = [
        "day-cell",
        isDone ? "day-done" : "",
        isToday ? "day-today" : ""
      ]
        .filter(Boolean)
        .join(" ");

      return `<td class="${classes}">
        <div class="day-num">${day}</div>
        <div class="day-pct">${percent}%</div>
        <div class="day-box"></div>
      </td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");

  return `
    <div class="daily-grid">
      <div class="daily-legend">
        <span class="legend-item"><span class="legend-swatch legend-done"></span>dias transcurridos</span>
        <span class="legend-item"><span class="legend-swatch legend-today"></span>hoy (marca la casilla)</span>
      </div>
      <div class="daily-wrap">
        <table class="daily-table">
          <thead><tr>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <div class="small-muted">Cada dia muestra el porcentaje orientativo acumulado. Marque la casilla del dia correspondiente.</div>
    </div>
  `;
}

function renderRecoveryBlock(content: GeneratedContent) {
  const r = content.recovery;
  if (!r) return "";

  // Handle non-time-based recovery profiles (chronic/episodic)
  const rp = r as any;
  if (rp.kind === "chronic") {
    const note =
      "Seguimiento orientativo. No implica curacion completa ni sustituye la valoracion medica.";
    const review = rp.reviewEveryDays
      ? `${rp.reviewEveryDays} dias`
      : "segun indicacion";
    return `
      <div class="section">
        <div class="section-title">Seguimiento</div>
        <div class="recovery-grid">
          <div class="recovery-card">
            <div class="recovery-subtitle">${escapeHtml(rp.title)}</div>
            <div class="phase-card">
              <div class="phase-desc">${escapeHtml(rp.description)}</div>
            </div>
            <div style="height: 10px;"></div>
            <div class="recovery-kv">
              <div><span class="kv-label">Frecuencia de revision</span><span class="kv-value">${escapeHtml(
                review
              )}</span></div>
              <div><span class="kv-label">Fecha de inicio</span><span class="kv-value">${escapeHtml(
                rp.incidentDate ?? "-"
              )}</span></div>
            </div>
            <div class="small-muted">${escapeHtml(note)}</div>
          </div>
          <div class="recovery-card">
            <div class="recovery-subtitle">Registro de revisiones</div>
            <div class="small-muted">Marque una casilla por revision.</div>
            <div class="check-grid">
              ${Array.from({ length: 12 }, () => `<div class="check-box"></div>`).join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (rp.kind === "episodic") {
    const note =
      "Evolucion orientativa por episodios. No es una garantia clinica.";
    const episode = rp.typicalEpisodeDays
      ? `${rp.typicalEpisodeDays} dias`
      : "variable";
    return `
      <div class="section">
        <div class="section-title">Evolucion por episodios</div>
        <div class="recovery-grid">
          <div class="recovery-card">
            <div class="recovery-subtitle">${escapeHtml(rp.title)}</div>
            <div class="phase-card">
              <div class="phase-desc">${escapeHtml(rp.description)}</div>
            </div>
            <div style="height: 10px;"></div>
            <div class="recovery-kv">
              <div><span class="kv-label">Duracion tipica de episodio</span><span class="kv-value">${escapeHtml(
                episode
              )}</span></div>
              <div><span class="kv-label">Fecha de inicio</span><span class="kv-value">${escapeHtml(
                rp.incidentDate ?? "-"
              )}</span></div>
            </div>
            <div class="small-muted">${escapeHtml(note)}</div>
          </div>
          <div class="recovery-card">
            <div class="recovery-subtitle">Registro de episodios</div>
            <div class="small-muted">Anote fechas o marque episodios.</div>
            <div class="check-grid">
              ${Array.from({ length: 12 }, () => `<div class="check-box"></div>`).join("")}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const percent = Math.min(Math.max((r as any).progressPercent, 0), 100);
  const note =
    "Evolucion orientativa segun fecha y duracion estimada. No es una garantia clinica.";

  const upcoming = r.upcomingMilestones?.length
    ? `<ul>${r.upcomingMilestones
        .map(
          (m) =>
            `<li><b>${escapeHtml(m.title)}</b> (dias ${m.startDay}-${m.endDay}): ${escapeHtml(m.description)}</li>`
        )
        .join("")}</ul>`
    : `<div class="small-muted">Sin hitos siguientes definidos.</div>`;

  const current =
    r.currentMilestone
      ? `<div class="phase-card">
          <div class="phase-title">${escapeHtml(r.currentMilestone.title)}</div>
          <div class="phase-desc">${escapeHtml(r.currentMilestone.description)}</div>
        </div>`
      : `<div class="phase-card">
          <div class="phase-title">${escapeHtml(r.currentPhase)}</div>
          <div class="phase-desc">Fase estimada segun el tiempo transcurrido.</div>
        </div>`;

  return `
    <div class="section">
      <div class="section-title">Progreso de recuperacion</div>
      <div class="recovery-grid">
        <div class="recovery-card">
          <div class="recovery-kv">
            <div><span class="kv-label">Fecha de incidencia</span><span class="kv-value">${escapeHtml(
              r.incidentDate
            )}</span></div>
            <div><span class="kv-label">Duracion estimada</span><span class="kv-value">${escapeHtml(
              String(r.totalDays)
            )} dias</span></div>
            <div><span class="kv-label">Fecha estimada de recuperacion</span><span class="kv-value">${escapeHtml(
              r.estimatedRecoveryDate
            )}</span></div>
            <div><span class="kv-label">Progreso</span><span class="kv-value">${escapeHtml(
              String(percent)
            )}% (${escapeHtml(String(r.daysElapsed))}/${escapeHtml(
              String(r.totalDays)
            )} dias)</span></div>
          </div>
          ${renderDailyProgressGrid(r.totalDays, r.daysElapsed)}
          <div class="small-muted">${escapeHtml(note)}</div>
        </div>

        <div class="recovery-card">
          <div class="recovery-subtitle">Fase actual</div>
          ${current}
          <div class="recovery-subtitle" style="margin-top: 12px;">Siguientes hitos</div>
          ${upcoming}
        </div>
      </div>
    </div>
  `;
}

export function renderHtml(content: GeneratedContent) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ficha medica para paciente</title>
  <style>
    * {
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 0;
      color: #1f2937;
      background: white;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 18mm 16mm;
      margin: 0 auto;
      background: white;
    }

    .header {
      border-bottom: 3px solid #1d4ed8;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    .title {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 14px;
      color: #475569;
      line-height: 1.5;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }

    .meta-card {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      background: #f8fafc;
    }

    .meta-label {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 4px;
    }

    .meta-value {
      font-size: 15px;
      color: #0f172a;
      line-height: 1.4;
    }

    .section {
      margin-top: 20px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 10px;
    }

    .callout {
      background: #eff6ff;
      border-left: 5px solid #2563eb;
      padding: 14px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 15px;
      line-height: 1.6;
    }

    .paragraph {
      font-size: 15px;
      line-height: 1.7;
      margin: 0;
    }

    .traffic-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin-top: 10px;
    }

    .traffic-card {
      border-radius: 12px;
      padding: 14px;
      border: 1px solid #d1d5db;
    }

    .traffic-card h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
    }

    .traffic-green {
      background: #ecfdf5;
      border-color: #86efac;
    }

    .traffic-yellow {
      background: #fefce8;
      border-color: #fde68a;
    }

    .traffic-red {
      background: #fef2f2;
      border-color: #fca5a5;
    }

    ul {
      margin: 0;
      padding-left: 18px;
    }

    li {
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.5;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-top: 10px;
    }

    .box {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 14px;
      background: #ffffff;
    }

    .box-title {
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 10px;
      color: #0f172a;
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .timeline-item {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 12px 14px;
      background: #f8fafc;
    }

    .timeline-period {
      font-size: 14px;
      font-weight: 700;
      color: #1d4ed8;
      margin-bottom: 4px;
    }

    .timeline-text {
      font-size: 14px;
      line-height: 1.5;
      color: #334155;
    }

    .footer-note {
      margin-top: 24px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      font-size: 13px;
      line-height: 1.6;
      color: #475569;
    }

    .med-block {
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: #ffffff;
      padding: 14px;
      margin-top: 10px;
    }

    .med-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 10px;
    }

    .med-table-wrap {
      overflow: hidden;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
    }

    .med-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .med-table th,
    .med-table td {
      border: 1px solid #cbd5e1;
      text-align: center;
      padding: 0;
      height: 18px;
      font-size: 11px;
      color: #0f172a;
    }

    .med-table thead th {
      background: #f8fafc;
      font-weight: 700;
      height: 22px;
    }

    .med-table .corner {
      width: 40px;
    }

    .med-table .row-head {
      background: #f8fafc;
      width: 40px;
      font-weight: 700;
    }

    .dose-cell {
      background: #ffffff;
    }

    .med-note {
      margin-top: 8px;
      font-size: 12px;
      color: #475569;
      line-height: 1.4;
    }

    .recovery-grid {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 14px;
      margin-top: 10px;
    }

    .recovery-card {
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: #ffffff;
      padding: 14px;
    }

    .recovery-kv {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 12px;
      margin-bottom: 10px;
    }

    .kv-label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .kv-value {
      display: block;
      font-size: 14px;
      color: #0f172a;
      line-height: 1.35;
    }

    .progress-outer {
      height: 12px;
      border-radius: 999px;
      background: #e2e8f0;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      margin: 8px 0 8px 0;
    }

    .progress-inner {
      height: 100%;
      background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 55%, #22c55e 100%);
      border-radius: 999px;
    }

    .daily-grid {
      margin-top: 6px;
    }

    .daily-legend {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 8px;
      font-size: 12px;
      color: #475569;
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .legend-swatch {
      width: 14px;
      height: 10px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      display: inline-block;
    }

    .legend-done {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .legend-today {
      background: #ecfdf5;
      border-color: #86efac;
    }

    .daily-wrap {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      overflow: hidden;
    }

    .daily-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .daily-table th {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      font-size: 10px;
      padding: 2px 0;
      height: 18px;
      color: #334155;
    }

    .day-cell {
      border: 1px solid #cbd5e1;
      height: 36px;
      padding: 2px 2px;
      vertical-align: top;
      background: #ffffff;
    }

    .day-empty {
      background: #ffffff;
      border-color: #e2e8f0;
    }

    .day-done {
      background: #eff6ff;
      border-color: #bfdbfe;
    }

    .day-today {
      outline: 2px solid #22c55e;
      outline-offset: -2px;
      background: #ecfdf5;
      border-color: #86efac;
    }

    .day-num {
      font-size: 10px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1;
    }

    .day-pct {
      font-size: 9px;
      color: #475569;
      line-height: 1.1;
      margin-top: 1px;
    }

    .day-box {
      margin-top: 3px;
      height: 10px;
      border: 1.5px solid #94a3b8;
      border-radius: 3px;
      background: #ffffff;
    }

    .small-muted {
      font-size: 12px;
      color: #475569;
      line-height: 1.4;
    }

    .recovery-subtitle {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .phase-card {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: #f8fafc;
      padding: 10px 12px;
    }

    .phase-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .phase-desc {
      font-size: 13px;
      color: #334155;
      line-height: 1.45;
    }

    .check-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-top: 10px;
    }

    .check-box {
      height: 18px;
      border: 1.5px solid #94a3b8;
      border-radius: 6px;
      background: #ffffff;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="title">Ficha informativa para el paciente</div>
      <div class="subtitle">
        Documento de apoyo para comprender el diagnostico y seguir mejor las indicaciones generales.
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Paciente</div>
        <div class="meta-value">${content.patientName}</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Edad</div>
        <div class="meta-value">${content.age} anos</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Diagnostico introducido</div>
        <div class="meta-value">${content.diagnosis}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Resumen rapido</div>
      <div class="callout">${content.summary}</div>
    </div>

    <div class="section">
      <div class="section-title">Explicacion sencilla</div>
      <p class="paragraph">${content.simpleExplanation}</p>
    </div>

    <div class="section">
      <div class="section-title">Semaforo de sintomas</div>
      <div class="traffic-grid">
        <div class="traffic-card traffic-green">
          <h3>Normal</h3>
          <ul>${renderList(content.trafficLight.green)}</ul>
        </div>
        <div class="traffic-card traffic-yellow">
          <h3>Vigilar</h3>
          <ul>${renderList(content.trafficLight.yellow)}</ul>
        </div>
        <div class="traffic-card traffic-red">
          <h3>Consultar</h3>
          <ul>${renderList(content.trafficLight.red)}</ul>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Recomendaciones generales</div>
      <div class="two-col">
        <div class="box">
          <div class="box-title">Que hacer</div>
          <ul>${renderList(content.recommendations.do)}</ul>
        </div>
        <div class="box">
          <div class="box-title">Que evitar</div>
          <ul>${renderList(content.recommendations.avoid)}</ul>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Evolucion esperada</div>
      <div class="timeline">
        ${renderTimeline(content.timeline)}
      </div>
    </div>

    ${renderRecoveryBlock(content)}

    ${
      content.medicationPlan?.length
        ? `
    <div class="section">
      <div class="section-title">Medicacion</div>
      ${content.medicationPlan.map(renderMedicationTable).join("")}
    </div>
    `
        : ""
    }

    <div class="footer-note">
      Este documento es informativo y no sustituye la valoracion de un profesional sanitario.
      Siga siempre las indicaciones de su medico.
    </div>
  </div>
</body>
</html>
  `;
}