import { Component, input } from '@angular/core';
import { Proyecto } from '../../models';

@Component({
    selector: 'app-procesos',
    standalone: true,
    imports: [],
    templateUrl: './procesos.html',
    styleUrl: './procesos.css'
})
export class ProcesosComponent {
    proyecto = input.required<Proyecto>();
}
