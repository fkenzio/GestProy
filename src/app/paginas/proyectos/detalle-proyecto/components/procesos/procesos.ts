import { Component, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Proyecto, Proceso, Subproceso, Tecnica, TecnicaAsignada } from '../../models';
import { ProcesoService } from '../../../../../compartidos/servicios/proceso.service';
import { SubprocesoService } from '../../../../../compartidos/servicios/subproceso.service';
import { TecnicaService } from '../../../../../compartidos/servicios/tecnica.service';

@Component({
    selector: 'app-procesos',
    standalone: true,
    imports: [FormsModule],
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

    mostrarFormProceso = signal(false);
    mostrarFormSubproceso = signal(false);
    mostrarAsignarTecnica = signal(false);

    nuevoProceso = signal({ nombre: '', descripcion: '', objetivo: '' });
    nuevoSubproceso = signal({ nombre: '', descripcion: '', horas_estimadas: '' });
    tecnicaSeleccionada = signal(0);
    notasTecnica = signal('');

    errorProceso = signal('');
    errorSubproceso = signal('');
    errorTecnica = signal('');

    constructor(
        private procesoService: ProcesoService,
        private subprocesoService: SubprocesoService,
        private tecnicaService: TecnicaService
    ) {
        effect(() => {
            const p = this.proyecto();
            if (p) {
                this.cargarProcesos(p.id);
                this.cargarTecnicas();
            }
        });
    }

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
                }
            }
        });
    }

    seleccionarProceso(proceso: Proceso): void {
        this.procesoSeleccionado.set(proceso);
        this.subprocesoSeleccionado.set(null);
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
                }
            }
        });
    }

    seleccionarSubproceso(subproceso: Subproceso): void {
        this.subprocesoSeleccionado.set(subproceso);
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
            }
        });
    }

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
}