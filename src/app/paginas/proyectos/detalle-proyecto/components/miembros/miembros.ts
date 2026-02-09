import { Component, input } from '@angular/core';
import { Proyecto } from '../../models';

@Component({
    selector: 'app-miembros',
    standalone: true,
    imports: [],
    templateUrl: './miembros.html',
    styleUrl: './miembros.css'
})
export class MiembrosComponent {
    proyecto = input.required<Proyecto>();
}
