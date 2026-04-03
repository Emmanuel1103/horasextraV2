// Texto configurable de la aplicación
export const DEFAULT_TEXT_LABELS = {
  // Títulos principales
  APP_TITLE: "Gestión de horas extras – FSD",
  MODULE_OVERTIME: "Reporte de horas extras",
  MODULE_NOMINA: "Gestión de horas extras",

  // Secciones
  SECTION_HORARIOS: "Configuración de horarios",
  SECTION_TASAS: "Configuración de porcentajes de horas extras",
  SECTION_USUARIOS: "Gestión de usuarios autorizados",
  SECTION_DIRECCIONES: "Direcciones y CeCos",

  // Campos de horarios
  LABEL_DIURNA_START: "Hora inicio turno diurno",
  LABEL_DIURNA_END: "Hora fin turno diurno",
  LABEL_NOCTURNA_START: "Hora inicio turno nocturno",
  LABEL_NOCTURNA_END: "Hora fin turno nocturno",
  LABEL_DIURNA_MULTIPLIER: "Horas extra diurna (multiplicador)",
  LABEL_NOCTURNA_MULTIPLIER: "Horas extra nocturna (multiplicador)",
  LABEL_DOMINICAL_DIURNA: "Dominical/festivo diurna (multiplicador)",
  LABEL_DOMINICAL_NOCTURNA: "Dominical/festivo nocturna (multiplicador)",

  // Campos de dirección
  LABEL_NOMBRE_DIRECCION: "Nombre de la dirección",
  LABEL_NOMBRE_DIRECTOR: "Nombre del director",
  LABEL_CORREO_DIRECTOR: "Correo del director",
  LABEL_CENTRO_COSTO: "Centro de costo",
  LABEL_NUMERO_CECO: "Número de CeCo",

  // Botones
  BTN_GUARDAR: "Guardar",
  BTN_RESTAURAR: "Restaurar valores predeterminados",
  BTN_AGREGAR_USUARIO: "Agregar usuario",
  BTN_AGREGAR_DIRECCION: "Agregar nueva dirección",
  BTN_EDITAR: "Editar",
  BTN_ELIMINAR: "Eliminar",
  BTN_ACTUALIZAR: "Configuración",
  BTN_AGREGAR: "Agregar dirección",
  BTN_CANCELAR: "Cancelar",
  BTN_AGREGAR_CECO: "Agregar CeCo",
  BTN_CARGAR_EXCEL: "Cargar desde Excel",
  BTN_EXPORT_ORIGINAL: "Exportar - inicial",
  BTN_EXPORT_NOMINA: "Exportar - nómina",

  // Mensajes
  MSG_HORARIOS_RESTAURADOS: "Horarios restaurados a valores predeterminados",
  MSG_UNIDAD_AGREGADA: "Unidad agregada exitosamente",
  MSG_UNIDAD_ACTUALIZADA: "Unidad actualizada exitosamente",
  MSG_UNIDAD_ELIMINADA: "Unidad eliminada exitosamente",
  MSG_CECO_AGREGADO: "Centro de costo agregado",
  MSG_USUARIO_AGREGADO: "Usuario agregado exitosamente",
  MSG_USUARIO_ELIMINADO: "Usuario eliminado exitosamente",
  MSG_ERROR_CAMPOS_REQUERIDOS: "Por favor completa todos los campos requeridos",
  MSG_ERROR_CECO_REQUERIDO: "Por favor completa todos los campos de la unidad y al menos un centro de costo",
  MSG_ERROR_USUARIO_REQUERIDO: "Por favor completa correo y contraseña",
  MSG_ERROR_MINIMA_UNIDAD: "Debe existir al menos una unidad",
  MSG_HORA_INVALIDA: "Hora inválida",
  MSG_RANGO_HORARIO_INVALIDO: "Rango horario inválido",

  // Placeholders
  PLACEHOLDER_NOMBRE: "Nombre del colaborador",
  PLACEHOLDER_CEDULA: "Cédula",
  PLACEHOLDER_CARGO: "Cargo",
  PLACEHOLDER_SALARIO: "Salario",
  PLACEHOLDER_CORREO: "Correo electrónico",
  PLACEHOLDER_CONTRASENA: "Contraseña",
  PLACEHOLDER_NUMERO_CECO: "Número de CeCo (ej: 1000)",
  PLACEHOLDER_NOMBRE_CENTRO: "Nombre del centro de costo",

  // Tabla y vistas
  TABLE_HEADER_NOMBRE: "Nombre del colaborador",
  TABLE_HEADER_CEDULA: "Cédula",
  TABLE_HEADER_CARGO: "Cargo",
  TABLE_HEADER_FECHA: "Fecha",
  TABLE_HEADER_HORAS: "Horas",
  TABLE_HEADER_VALOR: "Valor",
  TABLE_HEADER_ESTADO: "Estado",
  TABLE_HEADER_ACCIONES: "Acciones",

  // Otros
  LABEL_USUARIOS_ACTUALES: "Responsables de aprobación:",
  LABEL_UNIDADES_REGISTRADAS: "Total registros:",
  LABEL_NO_DATOS: "No hay datos disponibles",
  LABEL_CENTROS_COSTO: "Centros de costo",
  LABEL_AGREGAR_NUEVO: "Agregar nuevo:",
  LABEL_EDITAR_TEXTO: "Editar textos del aplicativo",
};

export type TextLabelKeys = keyof typeof DEFAULT_TEXT_LABELS;
