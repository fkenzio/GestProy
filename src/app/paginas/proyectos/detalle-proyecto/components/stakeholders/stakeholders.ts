import { Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Proyecto, Stakeholder } from '../../models';

@Component({
    selector: 'app-stakeholders',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './stakeholders.html',
    styleUrl: './stakeholders.css'
})
export class StakeholdersComponent {

    proyecto = input.required<Proyecto>();

    stakeholders = signal<Stakeholder[]>([
        { id: 1, nombre_completo: 'Roberto Sanchez', correo: 'roberto@empresa.com', telefono: '6141234567', organizacion: 'Empresa X', cargo: 'Director', tipo: 'cliente', nivel_influencia_interes: 'alto', notas: null },
        { id: 2, nombre_completo: 'Laura Gomez', correo: 'laura@proveedor.com', telefono: null, organizacion: 'Proveedor Y', cargo: 'Gerente', tipo: 'proveedor', nivel_influencia_interes: 'medio', notas: null }
    ]);

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

    guardar(): void {
        this.error.set('');
        const s = this.nuevo();

        if (!s.nombre_completo) {
            this.error.set('El nombre es obligatorio');
            return;
        }

        const actuales = this.stakeholders();
        const nuevoId = actuales.length + 1;
        this.stakeholders.set([...actuales, { id: nuevoId, ...s }]);
        this.resetForm();
    }

    eliminar(stakeholder: Stakeholder): void {
        this.stakeholders.set(this.stakeholders().filter(s => s.id !== stakeholder.id));
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