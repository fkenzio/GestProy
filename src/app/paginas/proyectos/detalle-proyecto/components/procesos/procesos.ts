import { Component, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Proyecto, Proceso, Subproceso, Tecnica, TecnicaAsignada, Requerimiento, CriterioAceptacion, EjecucionTecnica } from '../../models';
import { ProcesoService } from '../../../../../compartidos/servicios/proceso.service';
import { SubprocesoService } from '../../../../../compartidos/servicios/subproceso.service';
import { TecnicaService } from '../../../../../compartidos/servicios/tecnica.service';
import { RequerimientoService } from '../../../../../compartidos/servicios/requerimiento.service';
import { EjecucionService } from '../../../../../compartidos/servicios/ejecucion.service';

@Component({
    selector: 'app-procesos',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './procesos.html',
    styleUrl: './procesos.css'
})
export class ProcesosComponent {

    proyecto = input.required<Proyecto>();

    procesos = signal<Proceso[]>([]);
    subprocesos = signal<Subproceso[]>([]);
    procesoSeleccionado = signal<Proceso | null>(null);
    subprocesoSeleccionado = signal<Subproceso | null>(null);

    tecnicasDisponibles = signal<Tecnica[]>([]);

    // requerimientos y ejecuciones
    requerimientos = signal<Requerimiento[]>([]);
    ejecuciones = signal<EjecucionTecnica[]>([]);
    tecnicaParaReqs = signal<TecnicaAsignada | null>(null);

    mostrarFormProceso = signal(false);
    mostrarFormSubproceso = signal(false);
    mostrarAsignarTecnica = signal(false);
    mostrarFormRequerimiento = signal(false);
    mostrarFormEjecucion = signal(false);
    mostrarFormCriterio = signal(false);
    requerimientoDetalle = signal<Requerimiento | null>(null);
    ejecucionDetalle = signal<EjecucionTecnica | null>(null);

    nuevoProceso = signal({ nombre: '', descripcion: '', objetivo: '' });
    nuevoSubproceso = signal({ nombre: '', descripcion: '', horas_estimadas: '' });
    tecnicaSeleccionada = signal(0);
    notasTecnica = signal('');

    nuevoRequerimiento = signal({ titulo: '', descripcion: '', tipo: 'funcional', prioridad: 'media' });
    nuevoCriterio = signal('');
    nuevaEjecucion = signal<any>({ participantes: '', notas: '', datos: {} });

    errorProceso = signal('');
    errorSubproceso = signal('');
    errorTecnica = signal('');
    errorRequerimiento = signal('');
    errorCriterio = signal('');
    errorEjecucion = signal('');

    constructor(
        private procesoService: ProcesoService,
        private subprocesoService: SubprocesoService,
        private tecnicaService: TecnicaService,
        private requerimientoService: RequerimientoService,
        private ejecucionService: EjecucionService
    ) {
        effect(() => {
            const p = this.proyecto();
            if (p) {
                this.cargarProcesos(p.id);
                this.cargarTecnicas();
            }
        });
    }

    // --- Procesos ---

    cargarProcesos(proyectoId: number): void {
        this.procesoService.listarPorProyecto(proyectoId).subscribe({
            next: (procesos) => this.procesos.set(procesos)
        });
    }

    cargarTecnicas(): void {
        this.tecnicaService.listar().subscribe({
            next: (tecnicas) => this.tecnicasDisponibles.set(tecnicas)
        });
    }

    agregarProceso(): void {
        this.errorProceso.set('');
        const p = this.nuevoProceso();
        if (!p.nombre) { this.errorProceso.set('El nombre es obligatorio'); return; }

        this.procesoService.crear({
            proyecto_id: this.proyecto().id,
            nombre: p.nombre,
            descripcion: p.descripcion || null,
            objetivo: p.objetivo || null
        }).subscribe({
            next: (res) => {
                this.procesos.set([...this.procesos(), res.proceso]);
                this.nuevoProceso.set({ nombre: '', descripcion: '', objetivo: '' });
                this.mostrarFormProceso.set(false);
            },
            error: (err) => this.errorProceso.set(err.error?.error || 'Error')
        });
    }

    eliminarProceso(proceso: Proceso): void {
        this.procesoService.eliminar(proceso.id).subscribe({
            next: () => {
                this.procesos.set(this.procesos().filter(p => p.id !== proceso.id));
                this.subprocesos.set(this.subprocesos().filter(s => s.proceso_id !== proceso.id));
                if (this.procesoSeleccionado()?.id === proceso.id) {
                    this.procesoSeleccionado.set(null);
                    this.subprocesoSeleccionado.set(null);
                    this.tecnicaParaReqs.set(null);
                    this.requerimientos.set([]);
                }
            }
        });
    }

    seleccionarProceso(proceso: Proceso): void {
        this.procesoSeleccionado.set(proceso);
        this.subprocesoSeleccionado.set(null);
        this.tecnicaParaReqs.set(null);
        this.requerimientos.set([]);
        this.requerimientoDetalle.set(null);
        this.mostrarFormSubproceso.set(false);
        this.mostrarAsignarTecnica.set(false);

        this.subprocesoService.listarPorProceso(proceso.id).subscribe({
            next: (subs) => {
                const subsFiltrados = this.subprocesos().filter(s => s.proceso_id !== proceso.id);
                this.subprocesos.set([...subsFiltrados, ...subs.map(s => ({ ...s, tecnicas: [] }))]);
            }
        });
    }

    subprocesosDeProceso(): Subproceso[] {
        const proceso = this.procesoSeleccionado();
        if (!proceso) return [];
        return this.subprocesos().filter(s => s.proceso_id === proceso.id);
    }

    // --- Subprocesos ---

    agregarSubproceso(): void {
        this.errorSubproceso.set('');
        const s = this.nuevoSubproceso();
        const proceso = this.procesoSeleccionado();
        if (!proceso) return;
        if (!s.nombre) { this.errorSubproceso.set('El nombre es obligatorio'); return; }

        this.subprocesoService.crear({
            proceso_id: proceso.id,
            nombre: s.nombre,
            descripcion: s.descripcion || null,
            horas_estimadas: s.horas_estimadas ? parseFloat(s.horas_estimadas) : null
        }).subscribe({
            next: (res) => {
                this.subprocesos.set([...this.subprocesos(), { ...res.subproceso, tecnicas: [] }]);
                this.nuevoSubproceso.set({ nombre: '', descripcion: '', horas_estimadas: '' });
                this.mostrarFormSubproceso.set(false);
            },
            error: (err) => this.errorSubproceso.set(err.error?.error || 'Error')
        });
    }

    eliminarSubproceso(subproceso: Subproceso): void {
        this.subprocesoService.eliminar(subproceso.id).subscribe({
            next: () => {
                this.subprocesos.set(this.subprocesos().filter(s => s.id !== subproceso.id));
                if (this.subprocesoSeleccionado()?.id === subproceso.id) {
                    this.subprocesoSeleccionado.set(null);
                    this.tecnicaParaReqs.set(null);
                    this.requerimientos.set([]);
                }
            }
        });
    }

    seleccionarSubproceso(subproceso: Subproceso): void {
        this.subprocesoSeleccionado.set(subproceso);
        this.tecnicaParaReqs.set(null);
        this.requerimientos.set([]);
        this.requerimientoDetalle.set(null);
        this.mostrarAsignarTecnica.set(false);

        this.tecnicaService.listarPorSubproceso(subproceso.id).subscribe({
            next: (asignaciones) => {
                const tecnicas: TecnicaAsignada[] = asignaciones.map(a => ({
                    id: a.id,
                    tecnica_id: a.tecnica_id,
                    nombre: a.tecnica?.nombre || '',
                    categoria: a.tecnica?.categoria || '',
                    notas: a.notas
                }));
                const subActualizado = { ...subproceso, tecnicas };
                this.subprocesos.set(this.subprocesos().map(s => s.id === subproceso.id ? subActualizado : s));
                this.subprocesoSeleccionado.set(subActualizado);
            }
        });
    }

    // --- Tecnicas ---

    asignarTecnica(): void {
        this.errorTecnica.set('');
        const tecId = this.tecnicaSeleccionada();
        const sub = this.subprocesoSeleccionado();
        if (!sub) return;
        if (!tecId) { this.errorTecnica.set('Selecciona una tecnica'); return; }

        const yaAsignada = sub.tecnicas.some(t => t.tecnica_id === tecId);
        if (yaAsignada) { this.errorTecnica.set('Esta tecnica ya esta asignada'); return; }

        this.tecnicaService.asignar({
            subproceso_id: sub.id,
            tecnica_id: tecId,
            notas: this.notasTecnica() || null
        }).subscribe({
            next: (res) => {
                const a = res.asignacion;
                const nuevaTecnica: TecnicaAsignada = {
                    id: a.id,
                    tecnica_id: a.tecnica_id,
                    nombre: a.tecnica?.nombre || '',
                    categoria: a.tecnica?.categoria || '',
                    notas: a.notas
                };

                const subActualizado = { ...sub, tecnicas: [...sub.tecnicas, nuevaTecnica] };
                this.subprocesos.set(this.subprocesos().map(s => s.id === sub.id ? subActualizado : s));
                this.subprocesoSeleccionado.set(subActualizado);

                this.tecnicaSeleccionada.set(0);
                this.notasTecnica.set('');
                this.mostrarAsignarTecnica.set(false);
            },
            error: (err) => this.errorTecnica.set(err.error?.error || 'Error')
        });
    }

    quitarTecnica(tecnica: TecnicaAsignada): void {
        const sub = this.subprocesoSeleccionado();
        if (!sub) return;

        this.tecnicaService.eliminarAsignacion(tecnica.id).subscribe({
            next: () => {
                const subActualizado = { ...sub, tecnicas: sub.tecnicas.filter(t => t.id !== tecnica.id) };
                this.subprocesos.set(this.subprocesos().map(s => s.id === sub.id ? subActualizado : s));
                this.subprocesoSeleccionado.set(subActualizado);
                if (this.tecnicaParaReqs()?.id === tecnica.id) {
                    this.tecnicaParaReqs.set(null);
                    this.requerimientos.set([]);
                    this.ejecuciones.set([]);
                }
            }
        });
    }

    // --- Requerimientos ---

    seleccionarTecnicaParaReqs(tecnica: TecnicaAsignada): void {
        this.tecnicaParaReqs.set(tecnica);
        this.requerimientoDetalle.set(null);
        this.ejecucionDetalle.set(null);
        this.mostrarFormRequerimiento.set(false);
        this.mostrarFormEjecucion.set(false);
        this.nuevaEjecucion.set({ participantes: '', notas: '', datos: this.obtenerDatosBase(tecnica.categoria) });

        this.requerimientoService.listarPorTecnica(tecnica.id).subscribe({
            next: (reqs) => this.requerimientos.set(reqs)
        });

        this.ejecucionService.listarPorTecnica(tecnica.id).subscribe({
            next: (ejecs) => this.ejecuciones.set(ejecs)
        });
    }

    obtenerDatosBase(categoria: string): any {
        switch(categoria) {
            case 'entrevista': return { preguntas: [{ pregunta: '', respuesta: '' }] };
            case 'cuestionario': return { preguntas: [{ pregunta: '', tipo: 'abierta', respuesta: '' }] };
            case 'observacion': return { contexto: '', hallazgos: [{ descripcion: '' }] };
            case 'brainstorming': return { ideas: [{ descripcion: '', votos: 0 }] };
            case 'analisis_documental': return { documentos: [{ titulo: '', puntos_clave: '' }] };
            case 'casos_de_uso': return { actores: '', precondiciones: '', flujo_principal: '' };
            case 'prototipado': return { urls: '', feedback: '' };
            default: return {};
        }
    }

    // --- Ejecuciones ---

    agregarEjecucion(): void {
        this.errorEjecucion.set('');
        const e = this.nuevaEjecucion();
        const tec = this.tecnicaParaReqs();
        if (!tec) return;

        this.ejecucionService.crear({
            subproceso_tecnica_id: tec.id,
            participantes: e.participantes || null,
            notas: e.notas || null,
            datos: e.datos,
            fecha_ejecucion: new Date().toISOString().split('T')[0]
        }).subscribe({
            next: (res) => {
                this.ejecuciones.set([res.ejecucion, ...this.ejecuciones()]);
                this.nuevaEjecucion.set({ participantes: '', notas: '', datos: this.obtenerDatosBase(tec.categoria) });
                this.mostrarFormEjecucion.set(false);
            },
            error: (err) => this.errorEjecucion.set(err.error?.error || 'Error')
        });
    }

    eliminarEjecucion(ejec: EjecucionTecnica): void {
        this.ejecucionService.eliminar(ejec.id).subscribe({
            next: () => {
                this.ejecuciones.set(this.ejecuciones().filter(e => e.id !== ejec.id));
                if (this.ejecucionDetalle()?.id === ejec.id) {
                    this.ejecucionDetalle.set(null);
                }
            }
        });
    }

    verDetalleEjecucion(ejec: EjecucionTecnica): void {
        this.ejecucionDetalle.set(ejec);
    }

    cerrarDetalleEjecucion(): void {
        this.ejecucionDetalle.set(null);
    }

    cancelarEjecucion(): void {
        const tec = this.tecnicaParaReqs();
        this.nuevaEjecucion.set({ participantes: '', notas: '', datos: tec ? this.obtenerDatosBase(tec.categoria) : {} });
        this.errorEjecucion.set('');
        this.mostrarFormEjecucion.set(false);
    }
    
    // metodos de array dinamicos para el formulario de ejecucion
    agregarPregunta(): void {
        const e = this.nuevaEjecucion();
        e.datos.preguntas.push({ pregunta: '', respuesta: '' });
        this.nuevaEjecucion.set({...e});
    }

    eliminarPregunta(index: number): void {
        const e = this.nuevaEjecucion();
        e.datos.preguntas.splice(index, 1);
        this.nuevaEjecucion.set({...e});
    }

    agregarHallazgo(): void {
        const e = this.nuevaEjecucion();
        e.datos.hallazgos.push({ descripcion: '' });
        this.nuevaEjecucion.set({...e});
    }

    eliminarHallazgo(index: number): void {
        const e = this.nuevaEjecucion();
        e.datos.hallazgos.splice(index, 1);
        this.nuevaEjecucion.set({...e});
    }

    agregarIdea(): void {
        const e = this.nuevaEjecucion();
        e.datos.ideas.push({ descripcion: '', votos: 0 });
        this.nuevaEjecucion.set({...e});
    }

    eliminarIdea(index: number): void {
        const e = this.nuevaEjecucion();
        e.datos.ideas.splice(index, 1);
        this.nuevaEjecucion.set({...e});
    }

    agregarDocumento(): void {
        const e = this.nuevaEjecucion();
        e.datos.documentos.push({ titulo: '', puntos_clave: '' });
        this.nuevaEjecucion.set({...e});
    }

    eliminarDocumento(index: number): void {
        const e = this.nuevaEjecucion();
        e.datos.documentos.splice(index, 1);
        this.nuevaEjecucion.set({...e});
    }

    agregarRequerimiento(): void {
        this.errorRequerimiento.set('');
        const r = this.nuevoRequerimiento();
        const sub = this.subprocesoSeleccionado();
        const tec = this.tecnicaParaReqs();
        if (!sub || !tec) return;
        if (!r.titulo) { this.errorRequerimiento.set('El titulo es obligatorio'); return; }

        this.requerimientoService.crear({
            subproceso_id: sub.id,
            subproceso_tecnica_id: tec.id,
            titulo: r.titulo,
            descripcion: r.descripcion || null,
            tipo: r.tipo,
            prioridad: r.prioridad
        }).subscribe({
            next: (res) => {
                this.requerimientos.set([...this.requerimientos(), res.requerimiento]);
                this.nuevoRequerimiento.set({ titulo: '', descripcion: '', tipo: 'funcional', prioridad: 'media' });
                this.mostrarFormRequerimiento.set(false);
            },
            error: (err) => this.errorRequerimiento.set(err.error?.error || 'Error')
        });
    }

    eliminarRequerimiento(req: Requerimiento): void {
        this.requerimientoService.eliminar(req.id).subscribe({
            next: () => {
                this.requerimientos.set(this.requerimientos().filter(r => r.id !== req.id));
                if (this.requerimientoDetalle()?.id === req.id) {
                    this.requerimientoDetalle.set(null);
                }
            }
        });
    }

    verDetalleRequerimiento(req: Requerimiento): void {
        this.requerimientoDetalle.set(req);
        this.mostrarFormCriterio.set(false);
    }

    cerrarDetalle(): void {
        this.requerimientoDetalle.set(null);
    }

    actualizarEstadoRequerimiento(req: Requerimiento, estado: string): void {
        this.requerimientoService.actualizar(req.id, { estado }).subscribe({
            next: (res) => {
                const actualizado = res.requerimiento;
                this.requerimientos.set(this.requerimientos().map(r => r.id === req.id ? actualizado : r));
                if (this.requerimientoDetalle()?.id === req.id) {
                    this.requerimientoDetalle.set(actualizado);
                }
            }
        });
    }

    // --- Criterios de aceptacion ---

    agregarCriterio(): void {
        this.errorCriterio.set('');
        const req = this.requerimientoDetalle();
        const desc = this.nuevoCriterio();
        if (!req) return;
        if (!desc) { this.errorCriterio.set('La descripcion es obligatoria'); return; }

        this.requerimientoService.agregarCriterio(req.id, { descripcion: desc }).subscribe({
            next: (res) => {
                const actualizado = { ...req, criterios: [...req.criterios, res.criterio] };
                this.requerimientoDetalle.set(actualizado);
                this.requerimientos.set(this.requerimientos().map(r => r.id === req.id ? actualizado : r));
                this.nuevoCriterio.set('');
                this.mostrarFormCriterio.set(false);
            },
            error: (err) => this.errorCriterio.set(err.error?.error || 'Error')
        });
    }

    toggleCriterio(criterio: CriterioAceptacion): void {
        const req = this.requerimientoDetalle();
        if (!req) return;

        this.requerimientoService.actualizarCriterio(criterio.id, { cumplido: !criterio.cumplido }).subscribe({
            next: (res) => {
                const criteriosActualizados = req.criterios.map(c => c.id === criterio.id ? res.criterio : c);
                const actualizado = { ...req, criterios: criteriosActualizados };
                this.requerimientoDetalle.set(actualizado);
                this.requerimientos.set(this.requerimientos().map(r => r.id === req.id ? actualizado : r));
            }
        });
    }

    eliminarCriterio(criterio: CriterioAceptacion): void {
        const req = this.requerimientoDetalle();
        if (!req) return;

        this.requerimientoService.eliminarCriterio(criterio.id).subscribe({
            next: () => {
                const criteriosFiltrados = req.criterios.filter(c => c.id !== criterio.id);
                const actualizado = { ...req, criterios: criteriosFiltrados };
                this.requerimientoDetalle.set(actualizado);
                this.requerimientos.set(this.requerimientos().map(r => r.id === req.id ? actualizado : r));
            }
        });
    }

    // --- Cancelar formularios ---

    cancelarProceso(): void {
        this.nuevoProceso.set({ nombre: '', descripcion: '', objetivo: '' });
        this.errorProceso.set('');
        this.mostrarFormProceso.set(false);
    }

    cancelarSubproceso(): void {
        this.nuevoSubproceso.set({ nombre: '', descripcion: '', horas_estimadas: '' });
        this.errorSubproceso.set('');
        this.mostrarFormSubproceso.set(false);
    }

    cancelarTecnica(): void {
        this.tecnicaSeleccionada.set(0);
        this.notasTecnica.set('');
        this.errorTecnica.set('');
        this.mostrarAsignarTecnica.set(false);
    }

    cancelarRequerimiento(): void {
        this.nuevoRequerimiento.set({ titulo: '', descripcion: '', tipo: 'funcional', prioridad: 'media' });
        this.errorRequerimiento.set('');
        this.mostrarFormRequerimiento.set(false);
    }

    cancelarCriterio(): void {
        this.nuevoCriterio.set('');
        this.errorCriterio.set('');
        this.mostrarFormCriterio.set(false);
    }

    // helpers para badges
    colorPrioridad(prioridad: string): string {
        const colores: Record<string, string> = { critica: '#dc2626', alta: '#f59e0b', media: '#2563eb', baja: '#6b7280' };
        return colores[prioridad] || '#6b7280';
    }

    colorEstado(estado: string): string {
        const colores: Record<string, string> = { borrador: '#6b7280', propuesto: '#2563eb', aprobado: '#16a34a', rechazado: '#dc2626' };
        return colores[estado] || '#6b7280';
    }
}