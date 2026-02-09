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