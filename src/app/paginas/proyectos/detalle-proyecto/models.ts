export interface Proyecto {
    id: number;
    nombre: string;
    descripcion: string | null;
    estado: string;
}

export interface Rol {
    id: number;
    nombre: string;
    descripcion: string | null;
    es_fijo: boolean;
}

export interface Miembro {
    id: number;
    usuario_id: number;
    nombre: string;
    apellido: string;
    correo: string;
    rol_id: number;
    rol_nombre: string;
    asignado_por: number | null;
}

export interface Stakeholder {
    id: number;
    nombre_completo: string;
    correo: string | null;
    telefono: string | null;
    organizacion: string | null;
    cargo: string | null;
    tipo: string;
    nivel_influencia_interes: string;
    notas: string | null;
}

export interface Proceso {
    id: number;
    nombre: string;
    descripcion: string | null;
    objetivo: string | null;
    responsable_id: number | null;
    estado: string;
}

export interface Subproceso {
    id: number;
    proceso_id: number;
    nombre: string;
    descripcion: string | null;
    responsable_id: number | null;
    estado: string;
    horas_estimadas: number | null;
    tecnicas: TecnicaAsignada[];
}

export interface Tecnica {
    id: number;
    nombre: string;
    descripcion: string | null;
    categoria: string;
}

export interface TecnicaAsignada {
    id: number;
    tecnica_id: number;
    nombre: string;
    categoria: string;
    notas: string | null;
}

export interface CriterioAceptacion {
    id: number;
    requerimiento_id: number;
    descripcion: string;
    cumplido: boolean;
    orden: number;
}

export interface Requerimiento {
    id: number;
    subproceso_id: number;
    subproceso_tecnica_id: number;
    codigo: string;
    titulo: string;
    descripcion: string | null;
    tipo: string;
    prioridad: string;
    estado: string;
    metadata: any;
    tecnica_nombre: string;
    tecnica_categoria: string;
    criterios: CriterioAceptacion[];
}

export interface EjecucionTecnica {
    id: number;
    subproceso_tecnica_id: number;
    datos: any;
    participantes: string | null;
    fecha_ejecucion: string | null;
    estado: string;
    notas: string | null;
    creado_por_nombre: string;
    creado_por_apellido: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
}

export interface Diagrama {
    id: number;
    proyecto_id: number;
    tipo: string;
    nombre: string;
    datos: any;
    creado_por: number;
    creado_por_nombre: string;
    creado_por_apellido: string;
    fecha_creacion: string;
    fecha_actualizacion: string;
}