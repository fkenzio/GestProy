import { Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Proyecto, Proceso, Subproceso, Tecnica, TecnicaAsignada } from '../../models';

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

    tecnicasDisponibles = signal<Tecnica[]>([
        { id: 1, nombre: 'Entrevista', descripcion: 'Entrevista estructurada o semiestructurada', categoria: 'interaccion' },
        { id: 2, nombre: 'Cuestionario', descripcion: 'Preguntas escritas para recopilar datos', categoria: 'interaccion' },
        { id: 3, nombre: 'Lluvia de ideas', descripcion: 'Generacion de ideas en grupo', categoria: 'interaccion' },
        { id: 4, nombre: 'Observacion directa', descripcion: 'Observar el proceso en campo', categoria: 'observacion' },
        { id: 5, nombre: 'Analisis documental', descripcion: 'Revision de documentos existentes', categoria: 'analisis' },
        { id: 6, nombre: 'Analisis FODA', descripcion: 'Fortalezas, oportunidades, debilidades, amenazas', categoria: 'analisis' }
    ]);

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

    agregarProceso(): void {
        this.errorProceso.set('');
        const p = this.nuevoProceso();
        if (!p.nombre) { this.errorProceso.set('El nombre es obligatorio'); return; }

        const actuales = this.procesos();
        const nuevoId = actuales.length + 1;
        this.procesos.set([...actuales, {
            id: nuevoId,
            nombre: p.nombre,
            descripcion: p.descripcion || null,
            objetivo: p.objetivo || null,
            responsable_id: null,
            estado: 'definido'
        }]);
        this.nuevoProceso.set({ nombre: '', descripcion: '', objetivo: '' });
        this.mostrarFormProceso.set(false);
    }

    eliminarProceso(proceso: Proceso): void {
        this.procesos.set(this.procesos().filter(p => p.id !== proceso.id));
        this.subprocesos.set(this.subprocesos().filter(s => s.proceso_id !== proceso.id));
        if (this.procesoSeleccionado()?.id === proceso.id) {
            this.procesoSeleccionado.set(null);
            this.subprocesoSeleccionado.set(null);
        }
    }

    seleccionarProceso(proceso: Proceso): void {
        this.procesoSeleccionado.set(proceso);
        this.subprocesoSeleccionado.set(null);
        this.mostrarFormSubproceso.set(false);
        this.mostrarAsignarTecnica.set(false);
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

        const actuales = this.subprocesos();
        const nuevoId = actuales.length + 1;
        this.subprocesos.set([...actuales, {
            id: nuevoId,
            proceso_id: proceso.id,
            nombre: s.nombre,
            descripcion: s.descripcion || null,
            responsable_id: null,
            estado: 'definido',
            horas_estimadas: s.horas_estimadas ? parseFloat(s.horas_estimadas) : null,
            tecnicas: []
        }]);
        this.nuevoSubproceso.set({ nombre: '', descripcion: '', horas_estimadas: '' });
        this.mostrarFormSubproceso.set(false);
    }

    eliminarSubproceso(subproceso: Subproceso): void {
        this.subprocesos.set(this.subprocesos().filter(s => s.id !== subproceso.id));
        if (this.subprocesoSeleccionado()?.id === subproceso.id) {
            this.subprocesoSeleccionado.set(null);
        }
    }

    seleccionarSubproceso(subproceso: Subproceso): void {
        this.subprocesoSeleccionado.set(subproceso);
        this.mostrarAsignarTecnica.set(false);
    }

    asignarTecnica(): void {
        this.errorTecnica.set('');
        const tecId = this.tecnicaSeleccionada();
        const sub = this.subprocesoSeleccionado();
        if (!sub) return;
        if (!tecId) { this.errorTecnica.set('Selecciona una tecnica'); return; }

        const yaAsignada = sub.tecnicas.some(t => t.tecnica_id === tecId);
        if (yaAsignada) { this.errorTecnica.set('Esta tecnica ya esta asignada'); return; }

        const tecnica = this.tecnicasDisponibles().find(t => t.id === tecId);
        if (!tecnica) return;

        const nuevaTecnica: TecnicaAsignada = {
            id: Date.now(),
            tecnica_id: tecnica.id,
            nombre: tecnica.nombre,
            categoria: tecnica.categoria,
            notas: this.notasTecnica() || null
        };

        const subActualizado = { ...sub, tecnicas: [...sub.tecnicas, nuevaTecnica] };
        this.subprocesos.set(this.subprocesos().map(s => s.id === sub.id ? subActualizado : s));
        this.subprocesoSeleccionado.set(subActualizado);

        this.tecnicaSeleccionada.set(0);
        this.notasTecnica.set('');
        this.mostrarAsignarTecnica.set(false);
    }

    quitarTecnica(tecnica: TecnicaAsignada): void {
        const sub = this.subprocesoSeleccionado();
        if (!sub) return;

        const subActualizado = { ...sub, tecnicas: sub.tecnicas.filter(t => t.id !== tecnica.id) };
        this.subprocesos.set(this.subprocesos().map(s => s.id === sub.id ? subActualizado : s));
        this.subprocesoSeleccionado.set(subActualizado);
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