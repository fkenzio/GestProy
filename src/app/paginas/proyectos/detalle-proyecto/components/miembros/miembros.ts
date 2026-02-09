import { Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Proyecto, Rol, Miembro } from '../../models';

@Component({
    selector: 'app-miembros',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './miembros.html',
    styleUrl: './miembros.css'
})
export class MiembrosComponent {

    proyecto = input.required<Proyecto>();

    roles = signal<Rol[]>([
        { id: 1, nombre: 'Product Owner', descripcion: 'Dueno del producto', es_fijo: true },
        { id: 2, nombre: 'Technical Leader', descripcion: 'Lider tecnico', es_fijo: true }
    ]);

    miembros = signal<Miembro[]>([
        { id: 1, usuario_id: 1, nombre: 'Carlos', apellido: 'Lopez', correo: 'carlos@correo.com', rol_id: 1, rol_nombre: 'Product Owner', asignado_por: null },
        { id: 2, usuario_id: 2, nombre: 'Ana', apellido: 'Martinez', correo: 'ana@correo.com', rol_id: 2, rol_nombre: 'Technical Leader', asignado_por: 1 }
    ]);

    mostrarFormRol = signal(false);
    mostrarFormMiembro = signal(false);

    nuevoRol = signal({ nombre: '', descripcion: '' });
    nuevoMiembro = signal({ correo: '', rol_id: 0 });

    errorRol = signal('');
    errorMiembro = signal('');

    agregarRol(): void {
        this.errorRol.set('');
        const rol = this.nuevoRol();

        if (!rol.nombre) {
            this.errorRol.set('El nombre del rol es obligatorio');
            return;
        }

        const rolesActuales = this.roles();
        const nuevoId = rolesActuales.length + 1;
        this.roles.set([...rolesActuales, { id: nuevoId, nombre: rol.nombre, descripcion: rol.descripcion, es_fijo: false }]);
        this.nuevoRol.set({ nombre: '', descripcion: '' });
        this.mostrarFormRol.set(false);
    }

    eliminarRol(rol: Rol): void {
        if (rol.es_fijo) return;
        this.roles.set(this.roles().filter(r => r.id !== rol.id));
    }

    agregarMiembro(): void {
        this.errorMiembro.set('');
        const miembro = this.nuevoMiembro();

        if (!miembro.correo) {
            this.errorMiembro.set('El correo es obligatorio');
            return;
        }
        if (!miembro.rol_id) {
            this.errorMiembro.set('Selecciona un rol');
            return;
        }

        const rol = this.roles().find(r => r.id === miembro.rol_id);
        const miembrosActuales = this.miembros();
        const nuevoId = miembrosActuales.length + 1;

        this.miembros.set([...miembrosActuales, {
            id: nuevoId,
            usuario_id: nuevoId + 10,
            nombre: 'Nuevo',
            apellido: 'Usuario',
            correo: miembro.correo,
            rol_id: miembro.rol_id,
            rol_nombre: rol?.nombre || '',
            asignado_por: 1
        }]);

        this.nuevoMiembro.set({ correo: '', rol_id: 0 });
        this.mostrarFormMiembro.set(false);
    }

    eliminarMiembro(miembro: Miembro): void {
        this.miembros.set(this.miembros().filter(m => m.id !== miembro.id));
    }

    cancelarRol(): void {
        this.nuevoRol.set({ nombre: '', descripcion: '' });
        this.errorRol.set('');
        this.mostrarFormRol.set(false);
    }

    cancelarMiembro(): void {
        this.nuevoMiembro.set({ correo: '', rol_id: 0 });
        this.errorMiembro.set('');
        this.mostrarFormMiembro.set(false);
    }
}