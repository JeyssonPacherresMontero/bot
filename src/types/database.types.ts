export type RolUsuario = 'supervisor' | 'admin';

export type EstadoReporte =
  | 'borrador'
  | 'editando'
  | 'pendiente'
  | 'corregido'
  | 'confirmado'
  | 'revisado'
  | 'rechazado';

export type PrioridadReporte = 'baja' | 'media' | 'alta' | 'critica';

export type TipoMantenimiento =
  | 'preventivo'
  | 'correctivo'
  | 'predictivo'
  | 'mejora'
  | 'inspeccion'
  | 'otro';

export type TipoNotificacion = 'parcial' | 'final';

export type RolEjecutante = 'TEC' | 'AYD';

export interface ResponsableEjecutante {
  nombre: string;
  rol: RolEjecutante;
}

export type OrigenReporte = 'audio' | 'texto';

export interface RepuestoItem {
  nombre: string;
  cantidad: number | null;
  codigo: string | null;
}

export type ProcedenciaItem = 'GMO' | 'EXT';

export interface HerramientaItem {
  nombre: string;
  modelo?: string | null;
  procedencia?: ProcedenciaItem | null;
}

export interface MaterialConsumibleItem {
  nombre: string;
  cantidad: number | null;
  unidad?: string | null;
  codigo?: string | null;
  procedencia?: ProcedenciaItem | null;
}

export interface Perfil {
  id: string;
  nombre: string;
  rol: RolUsuario;
  activo: boolean;
  created_at: string;
}

export interface UsuarioTelegram {
  chat_id: number;
  nombre: string;
  cargo: string | null;
  activo: boolean;
  created_at: string;
  total_reportes?: number;
}

export interface Reporte {
  id: string;
  numero: number;
  created_at: string;
  updated_at: string;
  telegram_chat_id: number | null;
  telegram_message_id: number | null;
  tecnico_nombre: string | null;
  tecnico_username: string | null;
  origen: OrigenReporte | null;
  audio_duracion_seg: number | null;
  texto_original: string | null;
  texto_correccion: string | null;
  equipo: string | null;
  codigo_equipo: string | null;
  area: string | null;
  tipo_mantenimiento: TipoMantenimiento | null;
  falla: string | null;
  causa_probable: string | null;
  actividades: string[];
  repuestos: RepuestoItem[];
  prioridad: PrioridadReporte | null;
  tipo_notificacion?: TipoNotificacion | null;
  numero_ot: string | null;
  fecha_intervencion: string | null;
  fecha_inicio?: string | null;
  hora_inicio?: string | null;
  fecha_fin?: string | null;
  hora_fin?: string | null;
  duracion_minutos: number | null;
  total_horas_hombre?: number | null;
  unidad?: string | null;
  ow_os?: string | null;
  puesto_trabajo?: string | null;
  titulo_trabajo?: string | null;
  supervisor_operaciones?: string | null;
  responsable_ejecucion?: string | null;
  responsables_ejecutantes?: ResponsableEjecutante[] | null;
  responsable_trabajo_nombre?: string | null;
  responsable_trabajo_telefono?: string | null;
  herramientas?: HerramientaItem[] | null;
  materiales_consumibles?: MaterialConsumibleItem[] | null;
  requiere_aviso?: boolean | null;
  observaciones: string | null;
  campos_faltantes: string[];
  confianza: number | null;
  raw_ia: Record<string, unknown> | null;
  tiempo_procesamiento_ms: number | null;
  estado: EstadoReporte;
  correcciones: number;
  comentario_supervisor: string | null;
  revisado_por: string | null;
  revisado_en: string | null;
  // Relación con perfiles
  revisor?: {
    id?: string;
    nombre: string;
    rol?: string;
  } | null;
}

export interface VKpiResumen {
  total_reportes: number;
  confirmados?: number;
  confirmados_por_revisar?: number;
  pendientes?: number;
  pendientes_historicos?: number;
  revisados?: number;
  rechazados: number;
  pct_sin_correccion: number | null;
  duracion_promedio_min: number | null;
  procesamiento_promedio_seg: number | null;
  confianza_promedio: number | null;
}

export interface VReportesPorDia {
  dia: string;
  total: number;
}

export interface VFallasPorEquipo {
  equipo: string;
  total_fallas: number;
  duracion_promedio_min: number | null;
  ultimo_reporte: string;
}

export interface VRepuestosMasUsados {
  repuesto: string;
  unidades?: number | null;
  unidades_informadas?: number | null;
  veces: number;
  veces_sin_cantidad?: number;
}

export interface VReportesPorTecnico {
  tecnico: string;
  total: number;
  duracion_promedio_min: number | null;
}

export interface EquipoConsolidado {
  id_clave: string;
  equipo: string;
  codigo_equipo: string | null;
  area: string | null;
  total_reportes: number;
  total_fallas: number;
  duracion_promedio_min: number | null;
  ultimo_reporte: string;
}

export interface RepuestoConsolidado {
  nombre: string;
  codigo: string | null;
  total_menciones: number;
  unidades_totales: number | null;
  tiene_cantidad_informada: boolean;
  equipos_utilizados: string[];
  ultimo_uso: string;
}
