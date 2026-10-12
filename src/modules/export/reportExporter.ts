import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle, 
  WidthType,
  ShadingType
} from 'docx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SettlementPreset, DisasterScenario, SimulationMetrics, FragilityPoint } from '../../types';
import { Language } from '../../context/LanguageContext';

export interface ExportReportData {
  settlement: SettlementPreset;
  scenario: DisasterScenario;
  metrics: SimulationMetrics;
  fragilityPoints: FragilityPoint[];
  resilienceHistory: Array<{ step: number; timeMin: number; resilienceIndex: number; evacuatedCount: number }>;
}

/**
 * Trigger browser file download from Blob
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Generate and download Microsoft Word (.docx) formal report
 */
export async function exportToWord(data: ExportReportData, lang: Language = 'es') {
  const { settlement, scenario, metrics, fragilityPoints } = data;
  const isEn = lang === 'en';

  const title = isEn 
    ? `COMMUNITY RESILIENCE DIGITAL TWIN REPORT — ${settlement.name.toUpperCase()}`
    : `INFORME TÉCNICO DEL GEMELO DIGITAL DE RESILIENCIA — ${settlement.name.toUpperCase()}`;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200, before: 100 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: isEn 
                  ? `Simulation Date: ${new Date().toLocaleDateString()} | Scenario: ${scenario.name}`
                  : `Fecha de Simulación: ${new Date().toLocaleDateString()} | Escenario: ${scenario.name}`,
                italics: true,
                color: '666666',
              }),
            ],
            spacing: { after: 400 },
          }),

          // Executive Summary Section
          new Paragraph({
            text: isEn ? '1. Executive Summary & Resilience Diagnostics' : '1. Resumen Ejecutivo y Diagnóstico de Resiliencia',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: isEn
                  ? `This report details the multi-scale dynamic simulation of the digital twin in ${settlement.name} (${settlement.city}, ${settlement.country}) facing a ${scenario.name} disaster scenario. The system achieved a Resilience Score of `
                  : `El presente informe detalla la simulación multi-escala del gemelo digital en ${settlement.name} (${settlement.city}, ${settlement.country}) ante un escenario de ${scenario.name}. El sistema alcanzó un Índice de Resiliencia de `,
              }),
              new TextRun({
                text: `${metrics.systemResilienceIndex}/100`,
                bold: true,
                color: metrics.systemResilienceIndex > 60 ? '10B981' : 'F27D26',
              }),
              new TextRun({
                text: isEn
                  ? ` with an evacuation completion rate of ${metrics.evacuationRatePct}% across ${metrics.totalAgents} modeled households.`
                  : ` con una tasa de evacuación efectiva del ${metrics.evacuationRatePct}% en ${metrics.totalAgents} hogares modelados.`,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Metrics Summary Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: isEn ? 'Metric Indicator' : 'Indicador de Simulación', bold: true })] })],
                    shading: { fill: 'E2E8F0', type: ShadingType.CLEAR, color: 'auto' },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: isEn ? 'Observed Value' : 'Valor Observado', bold: true })] })],
                    shading: { fill: 'E2E8F0', type: ShadingType.CLEAR, color: 'auto' },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: isEn ? 'System Resilience Index (0-100)' : 'Índice de Resiliencia del Sistema' })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${metrics.systemResilienceIndex} pts`, bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: isEn ? 'Evacuation Rate (%)' : 'Tasa de Evacuación Efectiva' })] }),
                  new TableCell({ children: [new Paragraph({ text: `${metrics.evacuationRatePct}% (${metrics.safeCount} / ${metrics.totalAgents})` })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: isEn ? 'Estimated Structural Damage' : 'Daño Estructural Estimado' })] }),
                  new TableCell({ children: [new Paragraph({ text: `${metrics.estimatedStructuralDamagePct}%` })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: isEn ? 'Trapped / At-Risk Households' : 'Hogares Atrapados / En Riesgo' })] }),
                  new TableCell({ children: [new Paragraph({ text: `${metrics.trappedCount} hogares` })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ text: isEn ? 'Injured Residents' : 'Personas Lesionadas' })] }),
                  new TableCell({ children: [new Paragraph({ text: `${metrics.injuredCount} personas` })] }),
                ],
              }),
            ],
          }),

          // Territorial Profile Section
          new Paragraph({
            text: isEn ? '2. Territorial Profile & Physical Parameters' : '2. Perfil Territorial y Parámetros Físicos',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            text: isEn
              ? `• Settlement: ${settlement.name} | City: ${settlement.city} (${settlement.country})\n• Area: ${settlement.areaHa} Ha | Density: ${settlement.densityHabHa} hab/Ha\n• Topography: Avg Slope ${settlement.avgSlopeDeg}°, Elevation span: ${settlement.minElevationM}m - ${settlement.maxElevationM}m\n• Social Capital Index: ${Math.round(settlement.socialCapitalIndex * 100)}% | Institutional Trust: ${Math.round(settlement.institutionalTrustScore * 100)}%`
              : `• Asentamiento: ${settlement.name} | Ciudad: ${settlement.city} (${settlement.country})\n• Superficie: ${settlement.areaHa} Ha | Densidad: ${settlement.densityHabHa} hab/Ha\n• Topografía: Pendiente promedio ${settlement.avgSlopeDeg}°, Rango de elevación: ${settlement.minElevationM}m - ${settlement.maxElevationM}m\n• Índice de Capital Social: ${Math.round(settlement.socialCapitalIndex * 100)}% | Confianza Institucional: ${Math.round(settlement.institutionalTrustScore * 100)}%`,
            spacing: { after: 200 },
          }),

          // Fragility Points Section
          new Paragraph({
            text: isEn ? '3. Spatial Fragility Points & Chokepoints' : '3. Puntos de Fragilidad Espacial y Cuellos de Botella',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: isEn ? 'Chokepoint Name' : 'Punto Crítico', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: isEn ? 'Severity' : 'Severidad', bold: true })] })] }),
                  new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: isEn ? 'Root Cause & Impact' : 'Causa y Diagnóstico', bold: true })] })] }),
                ],
              }),
              ...settlement.bottlenecks.map((bn) => 
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: bn.name })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: bn.severity.toUpperCase(), bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ text: bn.cause })] }),
                  ],
                })
              ),
            ],
          }),

          // Anticipatory Action Recommendations
          new Paragraph({
            text: isEn ? '4. Operational Directives & Anticipatory Protocols' : '4. Directivas Operativas y Protocolos Anticipatorios',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            text: isEn
              ? `1. Activate local siren relay and WhatsApp broadcast at least T-${scenario.parameters.warningLeadTimeMin} min.\n2. Dispatch community brigadists with megaphones to prioritize households with reduced mobility.\n3. Pre-position emergency clearance teams at critical central staircases.\n4. Coordinate with Civil Defense for rapid reception at ${settlement.meetingPoints.length} safe zones.`
              : `1. Activar sirenas comunitarias y canal WhatsApp de líderes mínimo a T-${scenario.parameters.warningLeadTimeMin} min.\n2. Desplegar brigadistas barriales para priorizar la evacuación de hogares con adultos mayores y personas con discapacidad.\n3. Despejar preventivamente las escalinatas principales y pasos de quebrada.\n4. Coordinar con Defensa Civil y Bomberos para recepción en los ${settlement.meetingPoints.length} puntos de encuentro seguros.`,
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const cleanName = settlement.name.toLowerCase().replace(/\s+/g, '_');
  downloadBlob(blob, `Reporte_Resiliencia_${cleanName}_${Date.now()}.docx`);
}

/**
 * 2. Generate and download Executive PDF (.pdf) report
 */
export function exportToPdf(data: ExportReportData, lang: Language = 'es') {
  const { settlement, scenario, metrics, fragilityPoints } = data;
  const isEn = lang === 'en';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Color palette
  const primaryColor: [number, number, number] = [242, 125, 38]; // #F27D26
  const darkColor: [number, number, number] = [16, 46, 39]; // #102e27

  // Header Banner
  doc.setFillColor(...darkColor);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(
    isEn ? 'COMMUNITY RESILIENCE DIGITAL TWIN — EXECUTIVE REPORT' : 'GEMELO DIGITAL DE RESILIENCIA — REPORTE EJECUTIVO',
    14,
    14
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(240, 240, 240);
  doc.text(
    `${settlement.name}, ${settlement.city} (${settlement.country}) · ${scenario.name} · ${new Date().toLocaleDateString()}`,
    14,
    22
  );

  // Key KPI Cards Grid
  const startY = 40;
  const cardW = 43;
  const cardH = 22;

  const kpis = [
    { label: isEn ? 'Resilience Score' : 'Índice Resiliencia', val: `${metrics.systemResilienceIndex}/100`, color: [242, 125, 38] },
    { label: isEn ? 'Evacuation Rate' : 'Tasa Evacuación', val: `${metrics.evacuationRatePct}%`, color: [16, 185, 129] },
    { label: isEn ? 'Structural Damage' : 'Daño Estructural', val: `${metrics.estimatedStructuralDamagePct}%`, color: [244, 63, 94] },
    { label: isEn ? 'Safe Households' : 'Hogares a Salvo', val: `${metrics.safeCount} / ${metrics.totalAgents}`, color: [6, 182, 212] },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (cardW + 5);
    doc.setFillColor(245, 247, 245);
    doc.setDrawColor(216, 221, 215);
    doc.roundedRect(x, startY, cardW, cardH, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setTextColor(100, 115, 107);
    doc.text(kpi.label, x + 4, startY + 7);

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + 4, startY + 16);
  });

  // Table 1: Simulation Diagnostics
  autoTable(doc, {
    startY: startY + cardH + 10,
    head: [[isEn ? 'Parameter / Metric' : 'Parámetro / Métrica', isEn ? 'Simulation Output' : 'Resultado de Simulación']],
    body: [
      [isEn ? 'Territorial Area & Density' : 'Área y Densidad', `${settlement.areaHa} Ha · ${settlement.densityHabHa} hab/Ha`],
      [isEn ? 'Topography Slope & Elevation' : 'Topografía y Pendientes', `Promedio ${settlement.avgSlopeDeg}° (${settlement.minElevationM}m - ${settlement.maxElevationM}m)`],
      [isEn ? 'Active Disaster Threat' : 'Amenaza Activa', `${scenario.name} (Intensidad ${scenario.parameters.intensityScale}/10)`],
      [isEn ? 'Early Warning Window' : 'Ventana de Alerta Temprana', `T-${scenario.parameters.warningLeadTimeMin} minutos`],
      [isEn ? 'Trapped / Priority Households' : 'Hogares en Riesgo / Atrapados', `${metrics.trappedCount} hogares`],
      [isEn ? 'Injured Count' : 'Personas Lesionadas', `${metrics.injuredCount} personas`],
    ],
    theme: 'grid',
    headStyles: { fillColor: darkColor, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 3 },
  });

  // Table 2: Critical Bottlenecks
  const currentY = (doc as any).lastAutoTable?.finalY || 130;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(isEn ? 'Critical Chokepoints & Vulnerabilities' : 'Cuellos de Botella y Puntos Críticos', 14, currentY + 10);

  autoTable(doc, {
    startY: currentY + 14,
    head: [[isEn ? 'Chokepoint' : 'Punto', isEn ? 'Severity' : 'Severidad', isEn ? 'Diagnosis' : 'Diagnóstico']],
    body: settlement.bottlenecks.map((bn) => [
      bn.name,
      bn.severity.toUpperCase(),
      bn.cause
    ]),
    theme: 'striped',
    headStyles: { fillColor: [242, 125, 38], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2.5 },
  });

  // Footer text
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(
      isEn ? 'Generated by Community Resilience Digital Twin · Urban Resilience Lab' : 'Generado por Gemelo Digital de Resiliencia · Laboratorio de Resiliencia Urbana',
      14,
      288
    );
    doc.text(`Página ${i} / ${pageCount}`, 180, 288);
  }

  const cleanName = settlement.name.toLowerCase().replace(/\s+/g, '_');
  doc.save(`Reporte_Ejecutivo_${cleanName}_${Date.now()}.pdf`);
}

/**
 * 3. Generate and download Microsoft Excel (.xlsx) dataset workbook
 */
export function exportToExcel(data: ExportReportData, lang: Language = 'es') {
  const { settlement, scenario, metrics, resilienceHistory } = data;
  const isEn = lang === 'en';

  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary KPIs
  const summaryData = [
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Settlement Name' : 'Nombre Asentamiento', [isEn ? 'Value' : 'Valor']: settlement.name },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'City & Country' : 'Ciudad y País', [isEn ? 'Value' : 'Valor']: `${settlement.city}, ${settlement.country}` },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Disaster Scenario' : 'Escenario de Amenaza', [isEn ? 'Value' : 'Valor']: scenario.name },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Hazard Intensity (1-10)' : 'Intensidad de Amenaza', [isEn ? 'Value' : 'Valor']: scenario.parameters.intensityScale },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Warning Lead Time (min)' : 'Tiempo de Alerta (min)', [isEn ? 'Value' : 'Valor']: scenario.parameters.warningLeadTimeMin },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'System Resilience Index (0-100)' : 'Índice de Resiliencia (0-100)', [isEn ? 'Value' : 'Valor']: metrics.systemResilienceIndex },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Evacuation Rate (%)' : 'Tasa de Evacuación (%)', [isEn ? 'Value' : 'Valor']: metrics.evacuationRatePct },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Structural Damage (%)' : 'Daño Estructural (%)', [isEn ? 'Value' : 'Valor']: metrics.estimatedStructuralDamagePct },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Total Households' : 'Total Hogares', [isEn ? 'Value' : 'Valor']: metrics.totalAgents },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Safe Count' : 'Hogares a Salvo', [isEn ? 'Value' : 'Valor']: metrics.safeCount },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Trapped Count' : 'Hogares Atrapados', [isEn ? 'Value' : 'Valor']: metrics.trappedCount },
    { [isEn ? 'Parameter' : 'Parámetro']: isEn ? 'Injured Count' : 'Personas Lesionadas', [isEn ? 'Value' : 'Valor']: metrics.injuredCount },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, isEn ? 'Resilience_Summary' : 'Resumen_Resiliencia');

  // Sheet 2: Household Agents Census
  const agentsData = settlement.households.map((h) => ({
    [isEn ? 'Household ID' : 'ID Hogar']: h.id,
    [isEn ? 'Name' : 'Nombre']: h.name,
    [isEn ? 'X Coord' : 'Coord X']: h.currentX,
    [isEn ? 'Y Coord' : 'Coord Y']: h.currentY,
    [isEn ? 'Elevation (m)' : 'Elevación (m)']: h.elevationM,
    [isEn ? 'Slope Angle (°)' : 'Pendiente (°)']: h.slopeAngleDeg,
    [isEn ? 'Roof Material' : 'Material Techo']: h.roofMaterial,
    [isEn ? 'Structural Vulnerability (0-1)' : 'Vulnerabilidad Estructural']: h.structuralVulnerability,
    [isEn ? 'Residents' : 'Habitantes']: h.residentsCount,
    [isEn ? 'Vulnerable Residents' : 'Habitantes Vulnerables']: h.vulnerableCount,
    [isEn ? 'Mobility Score (0-1)' : 'Movilidad']: h.mobilityScore,
    [isEn ? 'Risk Perception (0-1)' : 'Percepción Riesgo']: h.riskPerception,
    [isEn ? 'Warning Channel' : 'Canal Alerta']: h.warningChannel,
    [isEn ? 'State' : 'Estado']: h.state,
    [isEn ? 'Is Leader' : 'Es Líder']: h.isLeader ? 'SI' : 'NO',
    [isEn ? 'Social Ties Count' : 'Lazos Vecinales']: h.socialTies.length,
  }));
  const wsAgents = XLSX.utils.json_to_sheet(agentsData);
  XLSX.utils.book_append_sheet(wb, wsAgents, isEn ? 'Household_Census' : 'Censo_Hogares');

  // Sheet 3: Bottlenecks & Safe Zones
  const bottlenecksData = settlement.bottlenecks.map((bn) => ({
    [isEn ? 'Chokepoint ID' : 'ID']: bn.id,
    [isEn ? 'Name' : 'Nombre']: bn.name,
    [isEn ? 'Severity' : 'Severidad']: bn.severity,
    [isEn ? 'X' : 'X']: bn.x,
    [isEn ? 'Y' : 'Y']: bn.y,
    [isEn ? 'Congestion Factor' : 'Factor Congestión']: bn.congestionFactor,
    [isEn ? 'Cause' : 'Causa']: bn.cause,
  }));
  const wsBottlenecks = XLSX.utils.json_to_sheet(bottlenecksData);
  XLSX.utils.book_append_sheet(wb, wsBottlenecks, isEn ? 'Chokepoints' : 'Cuellos_de_Botella');

  // Sheet 4: Resilience Time Series
  if (resilienceHistory && resilienceHistory.length > 0) {
    const timeSeriesData = resilienceHistory.map((pt) => ({
      [isEn ? 'Step' : 'Paso']: pt.step,
      [isEn ? 'Time (min)' : 'Tiempo (min)']: pt.timeMin,
      [isEn ? 'Resilience Index (0-100)' : 'Índice Resiliencia']: pt.resilienceIndex,
      [isEn ? 'Evacuated Households' : 'Hogares Evacuados']: pt.evacuatedCount,
    }));
    const wsTimeline = XLSX.utils.json_to_sheet(timeSeriesData);
    XLSX.utils.book_append_sheet(wb, wsTimeline, isEn ? 'Resilience_Timeline' : 'Curva_Temporal');
  }

  const cleanName = settlement.name.toLowerCase().replace(/\s+/g, '_');
  XLSX.writeFile(wb, `Dataset_Resiliencia_${cleanName}_${Date.now()}.xlsx`);
}
