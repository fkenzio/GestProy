import { Component, input } from '@angular/core';
import { Proyecto } from '../../models';

@Component({
    selector: 'app-resumen',
    standalone: true,
    imports: [],
    templateUrl: './resumen.html',
    styleUrl: './resumen.css'
})
export class ResumenComponent {
    proyecto = input.required<Proyecto>();
}
