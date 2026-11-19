import ExcelJS from 'exceljs';
import type { Reporte, Perfil } from '@/types/database.types';
import { formatReporteNumero, formatFechaHoraLima } from './utils';

// Paleta de colores corporativos (ARGB para ExcelJS)
const COLORS = {
  headerBg: 'FF0F172A', // Slate 900 (Navy oscuro institucional)
  headerSubBg: 'FF1E293B', // Slate 800
  headerLightBg: 'FF334155', // Slate 700
  accentCyan: 'FF38BDF8', // Cyan corporativo
  textWhite: 'FFFFFFFF',
  textDark: 'FF0F172A',
  textMuted: 'FF64748B',
  borderLight: 'FFE2E8F0',
  borderDark: 'FF94A3B8',
  zebraBg: 'FFF8FAFC',
  whiteBg: 'FFFFFFFF',

  // Estados
  estadoRevisadoBg: 'FFDCFCE7', // Verde claro
  estadoRevisadoText: 'FF15803D',
  estadoRechazadoBg: 'FFFEE2E2', // Rojo claro
  estadoRechazadoText: 'FFB91C1C',
  estadoPendienteBg: 'FFFEF3C7', // Ámbar claro
  estadoPendienteText: 'FFB45309',
  estadoConfirmadoBg: 'FFDBEAFE', // Azul claro
  estadoConfirmadoText: 'FF1D4ED8',

  // Prioridades
  prioCriticaText: 'FFDC2626',
  prioAltaText: 'FFEA580C',
  prioMediaText: 'FF2563EB',
  prioBajaText: 'FF64748B',

  // KPIs
  kpiTotalBg: 'FFEFF6FF',
  kpiTotalBorder: 'FF3B82F6',
  kpiHorasBg: 'FFF5F3FF',
  kpiHorasBorder: 'FF8B5CF6',
  kpiAprobadoBg: 'FFF0FDF4',
  kpiAprobadoBorder: 'FF22C55E',
  kpiPendienteBg: 'FFFFFBEB',
  kpiPendienteBorder: 'FFF59E0B',
  kpiRechazadoBg: 'FFFFF1F2',
  kpiRechazadoBorder: 'FFF43F5E',
};

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: COLORS.borderLight } },
  left: { style: 'thin', color: { argb: COLORS.borderLight } },
  bottom: { style: 'thin', color: { argb: COLORS.borderLight } },
  right: { style: 'thin', color: { argb: COLORS.borderLight } },
};

/**
 * Exporta un listado completo de reportes a un libro Excel corporativo multi-hoja (.xlsx)
 */
export async function exportReportesToExcel(
  reportes: Reporte[],
  filename = `reporte_mantenimiento_${new Date().toISOString().slice(0, 10)}.xlsx`
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MaintAI Enterprise · Cogeneración Industrial';
  wb.lastModifiedBy = 'Supervisión de Mantenimiento';
  wb.created = new Date();
  wb.modified = new Date();

  // =========================================================================
  // HOJA 1: RESUMEN EJECUTIVO (KPIs & DASHBOARD GERENCIAL)
  // =========================================================================
  const wsKpi = wb.addWorksheet('📊 Resumen Ejecutivo', {
    views: [{ showGridLines: true }],
  });

  // Anchos de columna Hoja 1
  wsKpi.columns = [
    { width: 4 }, // A (margen)
    { width: 28 }, // B
    { width: 18 }, // C
    { width: 18 }, // D
    { width: 20 }, // E
    { width: 20 }, // F
    { width: 20 }, // G
    { width: 20 }, // H
  ];

  // Fila 2-4: Banner Corporativo Oficial
  wsKpi.mergeCells('B2:H2');
  const b2 = wsKpi.getCell('B2');
  b2.value = 'CENTRAL TÉRMICA & COGENERACIÓN INDUSTRIAL';
  b2.font = { name: 'Calibri', size: 15, bold: true, color: { argb: COLORS.textWhite } };
  b2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  b2.alignment = { vertical: 'middle', horizontal: 'center' };
  wsKpi.getRow(2).height = 32;

  wsKpi.mergeCells('B3:H3');
  const b3 = wsKpi.getCell('B3');
  b3.value = 'SISTEMA INTEGRAL DE GESTIÓN DE MANTENIMIENTO — MaintAI ENTERPRISE';
  b3.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.accentCyan } };
  b3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSubBg } };
  b3.alignment = { vertical: 'middle', horizontal: 'center' };
  wsKpi.getRow(3).height = 20;

  wsKpi.mergeCells('B4:H4');
  const b4 = wsKpi.getCell('B4');
  b4.value = 'INFORME GERENCIAL Y CONSOLIDADO DE INTERVENCIONES TÉCNICAS';
  b4.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.textWhite } };
  b4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerLightBg } };
  b4.alignment = { vertical: 'middle', horizontal: 'center' };
  wsKpi.getRow(4).height = 22;

  wsKpi.mergeCells('B5:H5');
  const b5 = wsKpi.getCell('B5');
  const fechaHoy = new Date().toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  b5.value = `Fecha de emisión: ${fechaHoy}  |  Total de registros analizados: ${reportes.length}  |  Estado: Consolidado Oficial de Planta`;
  b5.font = { name: 'Calibri', size: 9, italic: true, color: { argb: COLORS.textMuted } };
  b5.alignment = { vertical: 'middle', horizontal: 'center' };
  wsKpi.getRow(5).height = 18;

  // Cálculos de Indicadores
  const total = reportes.length;
  const totalMinutos = reportes.reduce((acc, r) => acc + (r.duracion_minutos || 0), 0);
  const totalHoras = (totalMinutos / 60).toFixed(1);
  const revisados = reportes.filter((r) => r.estado === 'revisado').length;
  const rechazados = reportes.filter((r) => r.estado === 'rechazado').length;
  const pendientes = reportes.filter(
    (r) => r.estado !== 'revisado' && r.estado !== 'rechazado'
  ).length;

  // Fila 7: Tarjetas de KPIs Principales
  wsKpi.mergeCells('B7:H7');
  const b7 = wsKpi.getCell('B7');
  b7.value = 'INDICADORES CLAVE DE GESTIÓN (KPIs)';
  b7.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerBg } };
  b7.alignment = { vertical: 'middle', horizontal: 'left' };
  wsKpi.getRow(7).height = 22;

  // Definición de Tarjetas KPI
  const kpis = [
    {
      col: 'B',
      colEnd: 'B',
      titulo: 'TOTAL INTERVENCIONES',
      valor: total,
      unidad: 'reportes',
      bg: COLORS.kpiTotalBg,
      border: COLORS.kpiTotalBorder,
    },
    {
      col: 'C',
      colEnd: 'D',
      titulo: 'TIEMPO TOTAL EMPLEADO',
      valor: `${totalHoras} h`,
      unidad: `${totalMinutos.toLocaleString()} minutos`,
      bg: COLORS.kpiHorasBg,
      border: COLORS.kpiHorasBorder,
    },
    {
      col: 'E',
      colEnd: 'E',
      titulo: 'APROBADOS / REVISADOS',
      valor: revisados,
      unidad: `${total ? Math.round((revisados / total) * 100) : 0}% efectividad`,
      bg: COLORS.kpiAprobadoBg,
      border: COLORS.kpiAprobadoBorder,
    },
    {
      col: 'F',
      colEnd: 'F',
      titulo: 'PENDIENTES DE REVISIÓN',
      valor: pendientes,
      unidad: `${total ? Math.round((pendientes / total) * 100) : 0}% en curso`,
      bg: COLORS.kpiPendienteBg,
      border: COLORS.kpiPendienteBorder,
    },
    {
      col: 'G',
      colEnd: 'H',
      titulo: 'OBSERVADOS / RECHAZADOS',
      valor: rechazados,
      unidad: `${total ? Math.round((rechazados / total) * 100) : 0}% requieren ajuste`,
      bg: COLORS.kpiRechazadoBg,
      border: COLORS.kpiRechazadoBorder,
    },
  ];

  kpis.forEach((k) => {
    const rangeTitle = `${k.col}8:${k.colEnd}8`;
    const rangeVal = `${k.col}9:${k.colEnd}9`;
    const rangeSub = `${k.col}10:${k.colEnd}10`;

    if (k.col !== k.colEnd) {
      wsKpi.mergeCells(rangeTitle);
      wsKpi.mergeCells(rangeVal);
      wsKpi.mergeCells(rangeSub);
    }

    const cT = wsKpi.getCell(`${k.col}8`);
    cT.value = k.titulo;
    cT.font = { name: 'Calibri', size: 8, bold: true, color: { argb: COLORS.textMuted } };
    cT.alignment = { vertical: 'middle', horizontal: 'center' };
    cT.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: k.bg } };

    const cV = wsKpi.getCell(`${k.col}9`);
    cV.value = k.valor;
    cV.font = { name: 'Calibri', size: 16, bold: true, color: { argb: COLORS.headerBg } };
    cV.alignment = { vertical: 'middle', horizontal: 'center' };
    cV.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: k.bg } };

    const cS = wsKpi.getCell(`${k.col}10`);
    cS.value = k.unidad;
    cS.font = { name: 'Calibri', size: 8, italic: true, color: { argb: COLORS.textMuted } };
    cS.alignment = { vertical: 'middle', horizontal: 'center' };
    cS.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: k.bg } };
  });
  wsKpi.getRow(8).height = 16;
  wsKpi.getRow(9).height = 24;
  wsKpi.getRow(10).height = 16;

  // TABLA: Distribución por Tipo de Mantenimiento
  wsKpi.mergeCells('B12:E12');
  const b12 = wsKpi.getCell('B12');
  b12.value = 'DISTRIBUCIÓN POR TIPO DE MANTENIMIENTO';
  b12.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };
  wsKpi.getRow(12).height = 20;

  const headTM = ['B13', 'C13', 'D13', 'E13'];
  const titlesTM = ['Régimen / Tipo', 'Cantidad', '% Participación', 'Horas Invertidas'];
  headTM.forEach((cell, idx) => {
    const c = wsKpi.getCell(cell);
    c.value = titlesTM[idx];
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textWhite } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSubBg } };
    c.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'left' : 'center' };
  });
  wsKpi.getRow(13).height = 20;

  const tiposList = ['correctivo', 'preventivo', 'predictivo', 'mejora', 'inspeccion', 'otro'];
  let rowTM = 14;
  tiposList.forEach((tipo) => {
    const sub = reportes.filter((r) => (r.tipo_mantenimiento || 'otro').toLowerCase() === tipo);
    const cant = sub.length;
    const pct = total ? Math.round((cant / total) * 100) : 0;
    const durMin = sub.reduce((acc, r) => acc + (r.duracion_minutos || 0), 0);
    const durH = (durMin / 60).toFixed(1);

    const c1 = wsKpi.getCell(`B${rowTM}`);
    c1.value = tipo.toUpperCase();
    c1.font = { name: 'Calibri', size: 9, bold: true };
    c1.border = BORDER_THIN;

    const c2 = wsKpi.getCell(`C${rowTM}`);
    c2.value = cant;
    c2.alignment = { horizontal: 'center' };
    c2.font = { name: 'Calibri', size: 9 };
    c2.border = BORDER_THIN;

    const c3 = wsKpi.getCell(`D${rowTM}`);
    c3.value = `${pct}%`;
    c3.alignment = { horizontal: 'center' };
    c3.font = { name: 'Calibri', size: 9 };
    c3.border = BORDER_THIN;

    const c4 = wsKpi.getCell(`E${rowTM}`);
    c4.value = `${durH} h`;
    c4.alignment = { horizontal: 'center' };
    c4.font = { name: 'Calibri', size: 9 };
    c4.border = BORDER_THIN;

    wsKpi.getRow(rowTM).height = 18;
    rowTM++;
  });

  // TABLA: Distribución por Prioridad (Lado Derecho)
  wsKpi.mergeCells('F12:H12');
  const f12 = wsKpi.getCell('F12');
  f12.value = 'CLASIFICACIÓN POR CRITICIDAD / PRIORIDAD';
  f12.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };

  const headPrio = ['F13', 'G13', 'H13'];
  const titlesPrio = ['Nivel de Prioridad', 'N° Casos', '% del Total'];
  headPrio.forEach((cell, idx) => {
    const c = wsKpi.getCell(cell);
    c.value = titlesPrio[idx];
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textWhite } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSubBg } };
    c.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'left' : 'center' };
  });

  const priosList = [
    { key: 'critica', label: 'CRÍTICA', color: COLORS.prioCriticaText },
    { key: 'alta', label: 'ALTA', color: COLORS.prioAltaText },
    { key: 'media', label: 'MEDIA', color: COLORS.prioMediaText },
    { key: 'baja', label: 'BAJA', color: COLORS.prioBajaText },
  ];
  let rowPrio = 14;
  priosList.forEach((prio) => {
    const cant = reportes.filter((r) => (r.prioridad || '').toLowerCase() === prio.key).length;
    const pct = total ? Math.round((cant / total) * 100) : 0;

    const c1 = wsKpi.getCell(`F${rowPrio}`);
    c1.value = prio.label;
    c1.font = { name: 'Calibri', size: 9, bold: true, color: { argb: prio.color } };
    c1.border = BORDER_THIN;

    const c2 = wsKpi.getCell(`G${rowPrio}`);
    c2.value = cant;
    c2.alignment = { horizontal: 'center' };
    c2.font = { name: 'Calibri', size: 9 };
    c2.border = BORDER_THIN;

    const c3 = wsKpi.getCell(`H${rowPrio}`);
    c3.value = `${pct}%`;
    c3.alignment = { horizontal: 'center' };
    c3.font = { name: 'Calibri', size: 9 };
    c3.border = BORDER_THIN;

    rowPrio++;
  });

  // =========================================================================
  // HOJA 2: DETALLE DE INTERVENCIONES TÉCNICAS (MATRIZ MAESTRA)
  // =========================================================================
  const wsDetalle = wb.addWorksheet('📋 Registro de Intervenciones', {
    views: [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: 3, // Congelar cabecera para scroll vertical cómodo
        showGridLines: true,
      },
    ],
  });

  // Título Banner Superior en Hoja 2
  wsDetalle.mergeCells('A1:AA1');
  const dTitle = wsDetalle.getCell('A1');
  dTitle.value =
    'CENTRAL TÉRMICA & COGENERACIÓN — REGISTRO HISTÓRICO Y DETALLADO DE INTERVENCIONES TÉCNICAS';
  dTitle.font = { name: 'Calibri', size: 12, bold: true, color: { argb: COLORS.textWhite } };
  dTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  dTitle.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDetalle.getRow(1).height = 26;

  // Subtítulo
  wsDetalle.mergeCells('A2:AA2');
  const dSub = wsDetalle.getCell('A2');
  dSub.value = `Reportes exportados: ${reportes.length} registros  |  Filtro aplicado: Todo el historial activo`;
  dSub.font = { name: 'Calibri', size: 9, italic: true, color: { argb: COLORS.accentCyan } };
  dSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSubBg } };
  dSub.alignment = { vertical: 'middle', horizontal: 'center' };
  wsDetalle.getRow(2).height = 18;

  // Definición de Columnas de la Matriz Detallada
  const columnsDetalle = [
    { header: 'N° REGISTRO', key: 'numero', width: 14 },
    { header: 'FECHA CREACIÓN', key: 'created_at', width: 18 },
    { header: 'ESTADO OFICIAL', key: 'estado', width: 18 },
    { header: 'NOTIFICACIÓN', key: 'tipo_notificacion', width: 15 },
    { header: 'N° ORDEN (OT)', key: 'numero_ot', width: 16 },
    { header: 'UNIDAD', key: 'unidad', width: 12 },
    { header: 'PUESTO TRABAJO', key: 'puesto_trabajo', width: 16 },
    { header: 'OW / OS', key: 'ow_os', width: 14 },
    { header: 'TÍTULO DEL TRABAJO', key: 'titulo_trabajo', width: 32 },
    { header: 'EQUIPO PRINCIPAL', key: 'equipo', width: 28 },
    { header: 'TAG / CÓDIGO', key: 'codigo_equipo', width: 15 },
    { header: 'ÁREA / UBICACIÓN', key: 'area', width: 22 },
    { header: 'TIPO MANTTO.', key: 'tipo_mantenimiento', width: 16 },
    { header: 'PRIORIDAD', key: 'prioridad', width: 14 },
    { header: 'TÉCNICO TITULAR', key: 'tecnico_nombre', width: 24 },
    { header: 'SUPERVISOR OP.', key: 'supervisor_operaciones', width: 24 },
    { header: 'RESP. EJECUCIÓN', key: 'responsable_ejecucion', width: 24 },
    { header: 'RESP. TRABAJO', key: 'responsable_trabajo_nombre', width: 24 },
    { header: 'TELÉFONO RESP.', key: 'responsable_trabajo_telefono', width: 16 },
    { header: 'CUADRILLA DE CAMPO', key: 'ejecutantes', width: 28 },
    { header: 'FECHA INICIO', key: 'fecha_inicio', width: 14 },
    { header: 'HORA INICIO', key: 'hora_inicio', width: 13 },
    { header: 'FECHA FIN', key: 'fecha_fin', width: 14 },
    { header: 'HORA FIN', key: 'hora_fin', width: 13 },
    { header: 'DURACIÓN (MIN)', key: 'duracion_min', width: 15 },
    { header: 'DURACIÓN (HRS)', key: 'duracion_hrs', width: 15 },
    { header: 'TOTAL H-H', key: 'total_horas_hombre', width: 14 },
    { header: 'DIAGNÓSTICO: FALLA OBSERVADA', key: 'falla', width: 40 },
    { header: 'CAUSA RAÍZ PROBABLE', key: 'causa_probable', width: 36 },
    { header: 'DETALLE TRABAJO Y MEDICIONES', key: 'actividades', width: 46 },
    { header: 'HERRAMIENTAS (GMO/EXT)', key: 'herramientas', width: 36 },
    { header: 'MATERIALES CONSUMIBLES', key: 'materiales_consumibles', width: 36 },
    { header: 'REPUESTOS CAPITALIZABLES', key: 'repuestos', width: 36 },
    { header: 'OBSERVACIONES TÉCNICAS', key: 'observaciones', width: 36 },
    { header: 'REQUIERE AVISO SAP', key: 'requiere_aviso', width: 18 },
    { header: 'CANAL ORIGEN', key: 'origen', width: 14 },
    { header: 'CONFIANZA IA', key: 'confianza', width: 14 },
    { header: 'SUPERVISOR REVISOR', key: 'revisor', width: 22 },
    { header: 'COMENTARIO SUPERVISOR', key: 'comentario_supervisor', width: 32 },
  ];

  // Aplicar cabecera de tabla en Fila 3
  const rowHeaders = wsDetalle.getRow(3);
  columnsDetalle.forEach((col, idx) => {
    const cell = rowHeaders.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textWhite } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerLightBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.borderDark } },
      bottom: { style: 'medium', color: { argb: COLORS.borderDark } },
      left: { style: 'thin', color: { argb: COLORS.borderDark } },
      right: { style: 'thin', color: { argb: COLORS.borderDark } },
    };
    wsDetalle.getColumn(idx + 1).width = col.width;
  });
  rowHeaders.height = 28;

  // Llenar datos de cada reporte
  reportes.forEach((r, rIdx) => {
    const rowNum = rIdx + 4;
    const row = wsDetalle.getRow(rowNum);
    const isZebra = rIdx % 2 === 1;
    const bgRow = isZebra ? COLORS.zebraBg : COLORS.whiteBg;

    const ejecutantesStr = (r.responsables_ejecutantes || [])
      .map((e) => `${e.nombre} (${e.rol})`)
      .join('; ');

    const repsStr = (r.repuestos || [])
      .map((rep) => `${rep.nombre}${rep.cantidad ? ` x${rep.cantidad}` : ''}${rep.codigo ? ` [${rep.codigo}]` : ''}`)
      .join('; ');

    const actsStr = (r.actividades || []).map((a, i) => `${i + 1}. ${a}`).join('\n');

    const herramientasStr = (r.herramientas || [])
      .map((h) => `${h.nombre}${h.modelo ? ` [${h.modelo}]` : ''} (${h.procedencia || 'GMO'})`)
      .join('; ');

    const matsStr = (r.materiales_consumibles || [])
      .map((m) => `${m.nombre}${m.cantidad !== null && m.cantidad !== undefined ? ` x${m.cantidad} ${m.unidad || 'un.'}` : ''}${m.codigo ? ` [${m.codigo}]` : ''} (${m.procedencia || 'GMO'})`)
      .join('; ');

    const durMin = r.duracion_minutos || 0;
    const durHrs = durMin ? Number((durMin / 60).toFixed(2)) : 0;

    const rowData: unknown[] = [
      formatReporteNumero(r.numero),
      formatFechaHoraLima(r.created_at),
      r.estado.toUpperCase(),
      (r.tipo_notificacion || '—').toUpperCase(),
      r.numero_ot ? `OT #${r.numero_ot}` : '—',
      (r.unidad || '—').toUpperCase(),
      (r.puesto_trabajo || '—').toUpperCase(),
      r.ow_os || '—',
      r.titulo_trabajo || '—',
      r.equipo || '—',
      r.codigo_equipo ? `[${r.codigo_equipo}]` : '—',
      r.area || '—',
      (r.tipo_mantenimiento || '—').toUpperCase(),
      (r.prioridad || '—').toUpperCase(),
      r.tecnico_nombre || '—',
      r.supervisor_operaciones || '—',
      r.responsable_ejecucion || '—',
      r.responsable_trabajo_nombre || '—',
      r.responsable_trabajo_telefono || '—',
      ejecutantesStr || r.tecnico_nombre || '—',
      r.fecha_inicio || (r.fecha_intervencion ? r.fecha_intervencion.slice(0, 10) : '—'),
      r.hora_inicio || '—',
      r.fecha_fin || '—',
      r.hora_fin || '—',
      durMin || '—',
      durHrs || '—',
      r.total_horas_hombre !== null && r.total_horas_hombre !== undefined
        ? r.total_horas_hombre
        : (r.duracion_minutos && r.duracion_minutos > 0
            ? Math.round(((r.duracion_minutos / 60) * Math.max(1, Array.isArray(r.responsables_ejecutantes) ? r.responsables_ejecutantes.filter((e) => e.nombre?.trim()).length || 1 : 1)) * 100) / 100
            : '—'),
      r.falla || '—',
      r.causa_probable || '—',
      actsStr || '—',
      herramientasStr || '—',
      matsStr || '—',
      repsStr || '—',
      r.observaciones || '—',
      r.requiere_aviso ? 'SÍ' : 'NO',
      (r.origen || '—').toUpperCase(),
      r.confianza ? `${Math.round(r.confianza * 100)}%` : '—',
      r.revisor?.nombre || '—',
      r.comentario_supervisor || '—',
    ];

    rowData.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val as ExcelJS.CellValue;
      cell.font = { name: 'Calibri', size: 9 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgRow } };
      cell.border = BORDER_THIN;

      // Alineación personalizada por tipo de columna
      if ([1, 2, 4, 5, 6, 7, 8, 11, 13, 14, 19, 21, 22, 23, 24, 25, 26, 27, 35, 36, 37].includes(cIdx + 1)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (cIdx + 1 === 3) {
        // Columna Estado con Formato Condicional visual
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        if (r.estado === 'revisado') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.estadoRevisadoBg } };
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.estadoRevisadoText } };
        } else if (r.estado === 'rechazado') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.estadoRechazadoBg } };
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.estadoRechazadoText } };
        } else if (r.estado === 'confirmado') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.estadoConfirmadoBg } };
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.estadoConfirmadoText } };
        } else {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.estadoPendienteBg } };
          cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.estadoPendienteText } };
        }
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });

    row.height = actsStr.length > 50 || repsStr.length > 50 ? 36 : 22;
  });

  // Habilitar Auto-Filtro de Excel en la cabecera
  wsDetalle.autoFilter = {
    from: { row: 3, column: 1 },
    to: { row: reportes.length + 3, column: columnsDetalle.length },
  };

  // =========================================================================
  // HOJA 3: CONSOLIDADO DE REPUESTOS Y MATERIALES
  // =========================================================================
  const wsReps = wb.addWorksheet('🔩 Repuestos y Materiales', {
    views: [{ showGridLines: true }],
  });

  // Anchos
  wsReps.columns = [
    { width: 6 }, // A
    { width: 14 }, // B N° Reporte
    { width: 28 }, // C Equipo
    { width: 14 }, // D Tag
    { width: 16 }, // E OT
    { width: 34 }, // F Descripción
    { width: 14 }, // G Cantidad
    { width: 18 }, // H Código SAP / Almacén
    { width: 16 }, // I Fecha
    { width: 22 }, // J Técnico
  ];

  // Banner Hoja Repuestos
  wsReps.mergeCells('B2:J2');
  const rB2 = wsReps.getCell('B2');
  rB2.value = 'CENTRAL TÉRMICA & COGENERACIÓN — CONSOLIDADO DE REPUESTOS Y CONSUMIBLES UTILIZADOS';
  rB2.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.textWhite } };
  rB2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  rB2.alignment = { vertical: 'middle', horizontal: 'center' };
  wsReps.getRow(2).height = 26;

  // Cabecera Fila 3
  const headReps = [
    'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'
  ];
  const titlesReps = [
    'N° INFORME', 'EQUIPO PRINCIPAL', 'CÓDIGO TAG', 'ORDEN (OT)',
    'DESCRIPCIÓN DEL REPUESTO / MATERIAL', 'CANTIDAD', 'CÓDIGO ALMACÉN', 'FECHA INTERV.', 'TÉCNICO'
  ];
  headReps.forEach((cell, idx) => {
    const c = wsReps.getCell(cell);
    c.value = titlesReps[idx];
    c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textWhite } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSubBg } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  wsReps.getRow(3).height = 22;

  // Poblar filas de repuestos
  let rowRepIdx = 4;
  reportes.forEach((rep) => {
    const items = rep.repuestos || [];
    items.forEach((item) => {
      const isZ = rowRepIdx % 2 === 1;
      const bg = isZ ? COLORS.zebraBg : COLORS.whiteBg;

      const c1 = wsReps.getCell(`B${rowRepIdx}`);
      c1.value = formatReporteNumero(rep.numero);
      c1.alignment = { horizontal: 'center' };

      const c2 = wsReps.getCell(`C${rowRepIdx}`);
      c2.value = rep.equipo || '—';

      const c3 = wsReps.getCell(`D${rowRepIdx}`);
      c3.value = rep.codigo_equipo ? `[${rep.codigo_equipo}]` : '—';
      c3.alignment = { horizontal: 'center' };

      const c4 = wsReps.getCell(`E${rowRepIdx}`);
      c4.value = rep.numero_ot ? `OT #${rep.numero_ot}` : '—';
      c4.alignment = { horizontal: 'center' };

      const c5 = wsReps.getCell(`F${rowRepIdx}`);
      c5.value = item.nombre;
      c5.font = { bold: true };

      const c6 = wsReps.getCell(`G${rowRepIdx}`);
      c6.value = item.cantidad !== null && item.cantidad !== undefined ? `${item.cantidad} un.` : '—';
      c6.alignment = { horizontal: 'center' };

      const c7 = wsReps.getCell(`H${rowRepIdx}`);
      c7.value = item.codigo || '—';
      c7.alignment = { horizontal: 'center' };

      const c8 = wsReps.getCell(`I${rowRepIdx}`);
      c8.value = rep.fecha_inicio || rep.fecha_intervencion || '—';
      c8.alignment = { horizontal: 'center' };

      const c9 = wsReps.getCell(`J${rowRepIdx}`);
      c9.value = rep.tecnico_nombre || '—';

      [c1, c2, c3, c4, c5, c6, c7, c8, c9].forEach((cell) => {
        cell.font = { name: 'Calibri', size: 9, ...cell.font };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.border = BORDER_THIN;
      });

      wsReps.getRow(rowRepIdx).height = 20;
      rowRepIdx++;
    });
  });

  // Descarga del Archivo en Navegador
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
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
 * Exporta un único reporte en formato de Ficha Técnica Ejecutiva (.xlsx)
 */
export async function exportSingleReporteToExcel(
  reporte: Reporte,
  supervisor?: Perfil | null,
  filename?: string
) {
  const defaultName = `informe_tecnico_${formatReporteNumero(reporte.numero)}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const fname = filename || defaultName;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'MaintAI Enterprise';
  wb.created = new Date();

  const ws = wb.addWorksheet(`Informe IT-${formatReporteNumero(reporte.numero)}`, {
    views: [{ showGridLines: true }],
  });

  ws.columns = [
    { width: 4 }, // A margen
    { width: 22 }, // B
    { width: 22 }, // C
    { width: 22 }, // D
    { width: 22 }, // E
  ];

  // Membrete
  ws.mergeCells('B2:E2');
  const b2 = ws.getCell('B2');
  b2.value = 'CENTRAL TÉRMICA & COGENERACIÓN INDUSTRIAL';
  b2.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.textWhite } };
  b2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  b2.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(2).height = 30;

  ws.mergeCells('B3:E3');
  const b3 = ws.getCell('B3');
  b3.value = `INFORME TÉCNICO DE INTERVENCIÓN OPERATIVA N° IT-${formatReporteNumero(reporte.numero)}`;
  b3.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.accentCyan } };
  b3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerSubBg } };
  b3.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(3).height = 22;

  // 1. Datos Generales (Formato Físico)
  ws.mergeCells('B5:E5');
  const b5 = ws.getCell('B5');
  b5.value = '1. IDENTIFICACIÓN DEL ACTIVO Y DATOS DE LA ORDEN';
  b5.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };

  const datosGen = [
    ['Título del Trabajo:', reporte.titulo_trabajo || '—', 'N° Orden (OT):', reporte.numero_ot ? `OT #${reporte.numero_ot}` : '—'],
    ['Equipo Principal:', reporte.equipo || '—', 'Código Tag:', reporte.codigo_equipo ? `[${reporte.codigo_equipo}]` : '—'],
    ['Área / Ubicación:', reporte.area || '—', 'Unidad Operativa:', (reporte.unidad || '—').toUpperCase()],
    ['Puesto de Trabajo:', (reporte.puesto_trabajo || '—').toUpperCase(), 'OW / OS:', reporte.ow_os || '—'],
    ['Tipo Mantenimiento:', (reporte.tipo_mantenimiento || '—').toUpperCase(), 'Tipo Notificación:', (reporte.tipo_notificacion || '—').toUpperCase()],
    ['Prioridad:', (reporte.prioridad || '—').toUpperCase(), 'Duración Efectiva:', reporte.duracion_minutos ? `${reporte.duracion_minutos} min` : '—'],
    ['Fecha de Inicio:', `${reporte.fecha_inicio || '—'} ${reporte.hora_inicio || ''}`, 'Fecha de Término:', `${reporte.fecha_fin || '—'} ${reporte.hora_fin || ''}`],
    [
      'Total Horas-Hombre:',
      reporte.total_horas_hombre !== null && reporte.total_horas_hombre !== undefined
        ? `${reporte.total_horas_hombre} H-H`
        : (reporte.duracion_minutos && reporte.duracion_minutos > 0
            ? `${(Math.round(((reporte.duracion_minutos / 60) * Math.max(1, Array.isArray(reporte.responsables_ejecutantes) ? reporte.responsables_ejecutantes.filter((e) => e.nombre?.trim()).length || 1 : 1)) * 100) / 100).toFixed(2)} H-H`
            : '—'),
      '¿Requiere Aviso SAP?:',
      reporte.requiere_aviso ? 'SÍ' : 'NO'
    ],
  ];

  let rIdx = 6;
  datosGen.forEach((row) => {
    ws.getCell(`B${rIdx}`).value = row[0];
    ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textMuted } };
    ws.getCell(`B${rIdx}`).border = BORDER_THIN;

    ws.getCell(`C${rIdx}`).value = row[1];
    ws.getCell(`C${rIdx}`).font = { name: 'Calibri', size: 9, bold: true };
    ws.getCell(`C${rIdx}`).border = BORDER_THIN;

    ws.getCell(`D${rIdx}`).value = row[2];
    ws.getCell(`D${rIdx}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textMuted } };
    ws.getCell(`D${rIdx}`).border = BORDER_THIN;

    ws.getCell(`E${rIdx}`).value = row[3];
    ws.getCell(`E${rIdx}`).font = { name: 'Calibri', size: 9, bold: true };
    ws.getCell(`E${rIdx}`).border = BORDER_THIN;

    ws.getRow(rIdx).height = 20;
    rIdx++;
  });

  // 2. Personal Técnico
  rIdx++;
  ws.mergeCells(`B${rIdx}:E${rIdx}`);
  ws.getCell(`B${rIdx}`).value = '2. PERSONAL EJECUTANTE & SUPERVISIÓN';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };
  rIdx++;

  const personal = [
    ['Técnico Titular:', reporte.tecnico_nombre || '—', 'Supervisor GM Operaciones:', reporte.supervisor_operaciones || '—'],
    ['Responsable Ejecución:', reporte.responsable_ejecucion || '—', 'Supervisor Revisor:', supervisor?.nombre || reporte.revisor?.nombre || '—'],
    ['Responsable Trabajo:', reporte.responsable_trabajo_nombre || '—', 'Celular Responsable:', reporte.responsable_trabajo_telefono || '—'],
  ];
  personal.forEach((row) => {
    ws.getCell(`B${rIdx}`).value = row[0];
    ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textMuted } };
    ws.getCell(`B${rIdx}`).border = BORDER_THIN;

    ws.getCell(`C${rIdx}`).value = row[1];
    ws.getCell(`C${rIdx}`).font = { name: 'Calibri', size: 9, bold: true };
    ws.getCell(`C${rIdx}`).border = BORDER_THIN;

    ws.getCell(`D${rIdx}`).value = row[2];
    ws.getCell(`D${rIdx}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textMuted } };
    ws.getCell(`D${rIdx}`).border = BORDER_THIN;

    ws.getCell(`E${rIdx}`).value = row[3];
    ws.getCell(`E${rIdx}`).font = { name: 'Calibri', size: 9, bold: true };
    ws.getCell(`E${rIdx}`).border = BORDER_THIN;

    ws.getRow(rIdx).height = 20;
    rIdx++;
  });

  // 3. Diagnóstico Técnico
  rIdx++;
  ws.mergeCells(`B${rIdx}:E${rIdx}`);
  ws.getCell(`B${rIdx}`).value = '3. DIAGNÓSTICO TÉCNICO DE LA INTERVENCIÓN';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };
  rIdx++;

  ws.getCell(`B${rIdx}`).value = 'Falla Reportada:';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textMuted } };
  ws.mergeCells(`C${rIdx}:E${rIdx}`);
  ws.getCell(`C${rIdx}`).value = reporte.falla || '—';
  ws.getCell(`C${rIdx}`).font = { name: 'Calibri', size: 9 };
  ws.getCell(`C${rIdx}`).alignment = { wrapText: true };
  ws.getRow(rIdx).height = 28;
  rIdx++;

  ws.getCell(`B${rIdx}`).value = 'Causa Raíz Probable:';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textMuted } };
  ws.mergeCells(`C${rIdx}:E${rIdx}`);
  ws.getCell(`C${rIdx}`).value = reporte.causa_probable || '—';
  ws.getCell(`C${rIdx}`).font = { name: 'Calibri', size: 9 };
  ws.getCell(`C${rIdx}`).alignment = { wrapText: true };
  ws.getRow(rIdx).height = 28;
  rIdx++;

  // 4. Actividades Ejecutadas
  rIdx++;
  ws.mergeCells(`B${rIdx}:E${rIdx}`);
  ws.getCell(`B${rIdx}`).value = '4. ACTIVIDADES TÉCNICAS EJECUTADAS';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };
  rIdx++;

  const acts = reporte.actividades || [];
  if (acts.length > 0) {
    acts.forEach((act, i) => {
      ws.getCell(`B${rIdx}`).value = `Paso ${i + 1}:`;
      ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textMuted } };
      ws.mergeCells(`C${rIdx}:E${rIdx}`);
      ws.getCell(`C${rIdx}`).value = act;
      ws.getCell(`C${rIdx}`).font = { name: 'Calibri', size: 9 };
      ws.getCell(`C${rIdx}`).border = BORDER_THIN;
      ws.getRow(rIdx).height = 20;
      rIdx++;
    });
  } else {
    ws.mergeCells(`B${rIdx}:E${rIdx}`);
    ws.getCell(`B${rIdx}`).value = 'No se detallaron actividades específicas.';
    ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, italic: true };
    rIdx++;
  }

  // 5. Repuestos
  rIdx++;
  ws.mergeCells(`B${rIdx}:E${rIdx}`);
  ws.getCell(`B${rIdx}`).value = '5. REPUESTOS Y MATERIALES EMPLEADOS';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };
  rIdx++;

  const reps = reporte.repuestos || [];
  if (reps.length > 0) {
    ws.getCell(`B${rIdx}`).value = 'Descripción';
    ws.getCell(`B${rIdx}`).font = { bold: true };
    ws.getCell(`C${rIdx}`).value = 'Cantidad';
    ws.getCell(`C${rIdx}`).font = { bold: true };
    ws.mergeCells(`D${rIdx}:E${rIdx}`);
    ws.getCell(`D${rIdx}`).value = 'Código SAP / Almacén';
    ws.getCell(`D${rIdx}`).font = { bold: true };
    [ws.getCell(`B${rIdx}`), ws.getCell(`C${rIdx}`), ws.getCell(`D${rIdx}`)].forEach((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerLightBg } };
      c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textWhite } };
    });
    rIdx++;

    reps.forEach((rep) => {
      ws.getCell(`B${rIdx}`).value = rep.nombre;
      ws.getCell(`B${rIdx}`).border = BORDER_THIN;
      ws.getCell(`C${rIdx}`).value = rep.cantidad ? `${rep.cantidad} un.` : '—';
      ws.getCell(`C${rIdx}`).alignment = { horizontal: 'center' };
      ws.getCell(`C${rIdx}`).border = BORDER_THIN;
      ws.mergeCells(`D${rIdx}:E${rIdx}`);
      ws.getCell(`D${rIdx}`).value = rep.codigo || '—';
      ws.getCell(`D${rIdx}`).alignment = { horizontal: 'center' };
      ws.getCell(`D${rIdx}`).border = BORDER_THIN;
      rIdx++;
    });
  } else {
    ws.mergeCells(`B${rIdx}:E${rIdx}`);
    ws.getCell(`B${rIdx}`).value = 'Intervención realizada sin consumo de repuestos de almacén.';
    ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, italic: true };
    rIdx++;
  }

  // 6. Herramientas Utilizadas (GMO / EXT)
  rIdx++;
  ws.mergeCells(`B${rIdx}:E${rIdx}`);
  ws.getCell(`B${rIdx}`).value = '6. HERRAMIENTAS UTILIZADAS (GMO / EXTERNA)';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };
  rIdx++;

  const tools = reporte.herramientas || [];
  if (tools.length > 0) {
    ws.getCell(`B${rIdx}`).value = 'Herramienta';
    ws.getCell(`B${rIdx}`).font = { bold: true };
    ws.mergeCells(`C${rIdx}:D${rIdx}`);
    ws.getCell(`C${rIdx}`).value = 'Modelo / Código';
    ws.getCell(`C${rIdx}`).font = { bold: true };
    ws.getCell(`E${rIdx}`).value = 'Procedencia';
    ws.getCell(`E${rIdx}`).font = { bold: true };
    [ws.getCell(`B${rIdx}`), ws.getCell(`C${rIdx}`), ws.getCell(`E${rIdx}`)].forEach((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerLightBg } };
      c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textWhite } };
    });
    rIdx++;

    tools.forEach((t) => {
      ws.getCell(`B${rIdx}`).value = t.nombre;
      ws.getCell(`B${rIdx}`).border = BORDER_THIN;
      ws.mergeCells(`C${rIdx}:D${rIdx}`);
      ws.getCell(`C${rIdx}`).value = t.modelo || '—';
      ws.getCell(`C${rIdx}`).border = BORDER_THIN;
      ws.getCell(`E${rIdx}`).value = t.procedencia || 'GMO';
      ws.getCell(`E${rIdx}`).alignment = { horizontal: 'center' };
      ws.getCell(`E${rIdx}`).border = BORDER_THIN;
      rIdx++;
    });
  } else {
    ws.mergeCells(`B${rIdx}:E${rIdx}`);
    ws.getCell(`B${rIdx}`).value = 'No se registraron herramientas especiales en este informe.';
    ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, italic: true };
    rIdx++;
  }

  // 7. Materiales Consumibles
  rIdx++;
  ws.mergeCells(`B${rIdx}:E${rIdx}`);
  ws.getCell(`B${rIdx}`).value = '7. MATERIALES CONSUMIBLES (GMO / EXTERNA)';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };
  rIdx++;

  const mats = reporte.materiales_consumibles || [];
  if (mats.length > 0) {
    ws.getCell(`B${rIdx}`).value = 'Material Consumible';
    ws.getCell(`B${rIdx}`).font = { bold: true };
    ws.getCell(`C${rIdx}`).value = 'Cantidad';
    ws.getCell(`C${rIdx}`).font = { bold: true };
    ws.getCell(`D${rIdx}`).value = 'Código / Espec.';
    ws.getCell(`D${rIdx}`).font = { bold: true };
    ws.getCell(`E${rIdx}`).value = 'Procedencia';
    ws.getCell(`E${rIdx}`).font = { bold: true };
    [ws.getCell(`B${rIdx}`), ws.getCell(`C${rIdx}`), ws.getCell(`D${rIdx}`), ws.getCell(`E${rIdx}`)].forEach((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerLightBg } };
      c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textWhite } };
    });
    rIdx++;

    mats.forEach((m) => {
      ws.getCell(`B${rIdx}`).value = m.nombre;
      ws.getCell(`B${rIdx}`).border = BORDER_THIN;
      ws.getCell(`C${rIdx}`).value = m.cantidad !== null && m.cantidad !== undefined ? `${m.cantidad} ${m.unidad || 'un.'}` : '—';
      ws.getCell(`C${rIdx}`).alignment = { horizontal: 'center' };
      ws.getCell(`C${rIdx}`).border = BORDER_THIN;
      ws.getCell(`D${rIdx}`).value = m.codigo || '—';
      ws.getCell(`D${rIdx}`).alignment = { horizontal: 'center' };
      ws.getCell(`D${rIdx}`).border = BORDER_THIN;
      ws.getCell(`E${rIdx}`).value = m.procedencia || 'GMO';
      ws.getCell(`E${rIdx}`).alignment = { horizontal: 'center' };
      ws.getCell(`E${rIdx}`).border = BORDER_THIN;
      rIdx++;
    });
  } else {
    ws.mergeCells(`B${rIdx}:E${rIdx}`);
    ws.getCell(`B${rIdx}`).value = 'No se utilizaron materiales consumibles en esta intervención.';
    ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, italic: true };
    rIdx++;
  }

  // 8. Observaciones y Sugerencias
  rIdx++;
  ws.mergeCells(`B${rIdx}:E${rIdx}`);
  ws.getCell(`B${rIdx}`).value = '8. OBSERVACIONES, SUGERENCIAS & AVISO SAP';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.headerBg } };
  rIdx++;

  ws.getCell(`B${rIdx}`).value = 'Observaciones:';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textMuted } };
  ws.mergeCells(`C${rIdx}:E${rIdx}`);
  ws.getCell(`C${rIdx}`).value = reporte.observaciones || 'Sin observaciones.';
  ws.getCell(`C${rIdx}`).font = { name: 'Calibri', size: 9 };
  ws.getRow(rIdx).height = 24;
  rIdx++;

  ws.getCell(`B${rIdx}`).value = '¿Requiere Aviso SAP?:';
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, bold: true, color: { argb: COLORS.textMuted } };
  ws.mergeCells(`C${rIdx}:E${rIdx}`);
  ws.getCell(`C${rIdx}`).value = reporte.requiere_aviso ? 'SÍ (REQUIERE GENERAR AVISO POR OBSERVACIONES ENCONTRADAS)' : 'NO REQUIERE AVISO';
  ws.getCell(`C${rIdx}`).font = { name: 'Calibri', size: 9, bold: true };
  ws.getRow(rIdx).height = 20;
  rIdx++;

  // 9. Firmas
  rIdx += 2;
  ws.mergeCells(`B${rIdx}:C${rIdx}`);
  ws.getCell(`B${rIdx}`).value = '_______________________________________';
  ws.getCell(`B${rIdx}`).alignment = { horizontal: 'center' };

  ws.mergeCells(`D${rIdx}:E${rIdx}`);
  ws.getCell(`D${rIdx}`).value = '_______________________________________';
  ws.getCell(`D${rIdx}`).alignment = { horizontal: 'center' };
  rIdx++;

  ws.mergeCells(`B${rIdx}:C${rIdx}`);
  ws.getCell(`B${rIdx}`).value = `TÉCNICO RESPONSABLE: ${reporte.tecnico_nombre || '—'}`;
  ws.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9, bold: true };
  ws.getCell(`B${rIdx}`).alignment = { horizontal: 'center' };

  ws.mergeCells(`D${rIdx}:E${rIdx}`);
  ws.getCell(`D${rIdx}`).value = `SUPERVISOR DE MANTENIMIENTO: ${supervisor?.nombre || reporte.revisor?.nombre || '—'}`;
  ws.getCell(`D${rIdx}`).font = { name: 'Calibri', size: 9, bold: true };
  ws.getCell(`D${rIdx}`).alignment = { horizontal: 'center' };

  // Descarga
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fname;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
