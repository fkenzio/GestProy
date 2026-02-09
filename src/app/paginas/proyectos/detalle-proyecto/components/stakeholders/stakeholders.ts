import { Component, input } from '@angular/core';
import { Proyecto } from '../../models';

@Component({
    selector: 'app-stakeholders',
    standalone: true,
    imports: [],
    templateUrl: './stakeholders.html',
    styleUrl: './stakeholders.css'
})
export class StakeholdersComponent {
    proyecto = input.required<Proyecto>();
}
