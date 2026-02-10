import { Component, input, signal, OnInit, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Proyecto, Rol, Miembro } from '../../models';
import { RolService } from '../../../../../compartidos/servicios/rol.service';
import { MiembroService } from '../../../../../compartidos/servicios/miembro.service';
import { UsuarioService } from '../../../../../compartidos/servicios/usuario.service';

@Component({
    selector: 'app-miembros',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './miembros.html',
    styleUrl: './miembros.css'
})
export class MiembrosComponent implements OnInit {

    proyecto = input.required<Proyecto>();

    roles = signal<Rol[]>([]);
    miembros = signal<Miembro[]>([]);
    usuariosDisponibles = signal<any[]>([]);

    mostrarFormRol = signal(false);
    mostrarFormMiembro = signal(false);

    nuevoRol = signal({ nombre: '', descripcion: '' });
    nuevoMiembro = signal({ usuario_id: 0, rol_id: 0 });

    errorRol = signal('');
    errorMiembro = signal('');

    constructor(
        private rolService: RolService,
        private miembroService: MiembroService,
        private usuarioService: UsuarioService
    ) {
        effect(() => {
            const p = this.proyecto();
            if (p) {
                this.cargarDatos(p.id);
            }
        });
    }

    ngOnInit(): void { }

    cargarDatos(proyectoId: number): void {
        this.rolService.listar(proyectoId).subscribe({
            next: (roles) => this.roles.set(roles)
        });

        this.miembroService.listarPorProyecto(proyectoId).subscribe({
            next: (miembros) => {
                this.miembros.set(miembros.map(m => ({
                    id: m.id,
                    usuario_id: m.usuario_id,
                    nombre: m.usuario?.nombre || '',
                    apellido: m.usuario?.apellido || '',
                    correo: m.usuario?.correo || '',
                    rol_id: m.rol_id,
                    rol_nombre: m.rol?.nombre || '',
                    asignado_por: m.asignado_por
                })));
            }
        });

        this.usuarioService.listar().subscribe({
            next: (usuarios) => this.usuariosDisponibles.set(usuarios)
        });
    }

    agregarRol(): void {
        this.errorRol.set('');
        const rol = this.nuevoRol();

        if (!rol.nombre) {
            this.errorRol.set('El nombre del rol es obligatorio');
            return;
        }

        this.rolService.crear({
            proyecto_id: this.proyecto().id,
            nombre: rol.nombre,
            descripcion: rol.descripcion || null
        }).subscribe({
            next: (res) => {
                this.roles.set([...this.roles(), res.rol]);
                this.nuevoRol.set({ nombre: '', descripcion: '' });
                this.mostrarFormRol.set(false);
            },
            error: (err) => this.errorRol.set(err.error?.error || 'Error al crear rol')
        });
    }

    eliminarRol(rol: Rol): void {
        if (rol.es_fijo) return;

        this.rolService.eliminar(rol.id).subscribe({
            next: () => this.roles.set(this.roles().filter(r => r.id !== rol.id))
        });
    }

    agregarMiembro(): void {
        this.errorMiembro.set('');
        const miembro = this.nuevoMiembro();

        if (!miembro.usuario_id) {
            this.errorMiembro.set('Selecciona un usuario');
            return;
        }
        if (!miembro.rol_id) {
            this.errorMiembro.set('Selecciona un rol');
            return;
        }

        this.miembroService.asignar({
            proyecto_id: this.proyecto().id,
            usuario_id: miembro.usuario_id,
            rol_id: miembro.rol_id
        }).subscribe({
            next: (res) => {
                const m = res.miembro;
                this.miembros.set([...this.miembros(), {
                    id: m.id,
                    usuario_id: m.usuario_id,
                    nombre: m.usuario?.nombre || '',
                    apellido: m.usuario?.apellido || '',
                    correo: m.usuario?.correo || '',
                    rol_id: m.rol_id,
                    rol_nombre: m.rol?.nombre || '',
                    asignado_por: m.asignado_por
                }]);
                this.nuevoMiembro.set({ usuario_id: 0, rol_id: 0 });
                this.mostrarFormMiembro.set(false);
            },
            error: (err) => this.errorMiembro.set(err.error?.error || 'Error al asignar miembro')
        });
    }

    eliminarMiembro(miembro: Miembro): void {
        this.miembroService.eliminar(miembro.id).subscribe({
            next: () => this.miembros.set(this.miembros().filter(m => m.id !== miembro.id))
        });
    }

    cancelarRol(): void {
        this.nuevoRol.set({ nombre: '', descripcion: '' });
        this.errorRol.set('');
        this.mostrarFormRol.set(false);
    }

    cancelarMiembro(): void {
        this.nuevoMiembro.set({ usuario_id: 0, rol_id: 0 });
        this.errorMiembro.set('');
        this.mostrarFormMiembro.set(false);
    }
}