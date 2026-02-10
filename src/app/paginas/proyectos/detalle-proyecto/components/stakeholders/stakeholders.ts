import { Component, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Proyecto, Stakeholder } from '../../models';
import { StakeholderService } from '../../../../../compartidos/servicios/stakeholder.service';

@Component({
    selector: 'app-stakeholders',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './stakeholders.html',
    styleUrl: './stakeholders.css'
})
export class StakeholdersComponent {

    proyecto = input.required<Proyecto>();

    stakeholders = signal<Stakeholder[]>([]);

    mostrarForm = signal(false);
    error = signal('');

    nuevo = signal<Omit<Stakeholder, 'id'>>({
        nombre_completo: '',
        correo: null,
        telefono: null,
        organizacion: null,
        cargo: null,
        tipo: 'externo',
        nivel_influencia_interes: 'medio',
        notas: null
    });

    constructor(private stakeholderService: StakeholderService) {
        effect(() => {
            const p = this.proyecto();
            if (p) {
                this.cargarStakeholders(p.id);
            }
        });
    }

    cargarStakeholders(proyectoId: number): void {
        this.stakeholderService.listarPorProyecto(proyectoId).subscribe({
            next: (stakeholders) => this.stakeholders.set(stakeholders)
        });
    }

    guardar(): void {
        this.error.set('');
        const s = this.nuevo();

        if (!s.nombre_completo) {
            this.error.set('El nombre es obligatorio');
            return;
        }

        this.stakeholderService.crear({
            proyecto_id: this.proyecto().id,
            ...s
        }).subscribe({
            next: (res) => {
                this.stakeholders.set([...this.stakeholders(), res.stakeholder]);
                this.resetForm();
            },
            error: (err) => this.error.set(err.error?.error || 'Error al crear stakeholder')
        });
    }

    eliminar(stakeholder: Stakeholder): void {
        this.stakeholderService.eliminar(stakeholder.id).subscribe({
            next: () => this.stakeholders.set(this.stakeholders().filter(s => s.id !== stakeholder.id))
        });
    }

    cancelar(): void {
        this.resetForm();
    }

    actualizarCampo(campo: string, valor: string): void {
        this.nuevo.set({ ...this.nuevo(), [campo]: valor || null });
    }

    private resetForm(): void {
        this.nuevo.set({
            nombre_completo: '',
            correo: null,
            telefono: null,
            organizacion: null,
            cargo: null,
            tipo: 'externo',
            nivel_influencia_interes: 'medio',
            notas: null
        });
        this.error.set('');
        this.mostrarForm.set(false);
    }
}