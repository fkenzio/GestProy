import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, switchMap, map } from 'rxjs';
import { ProyectoService } from './proyecto.service';
import { MiembroService } from './miembro.service';
import { StakeholderService } from './stakeholder.service';
import { ProcesoService } from './proceso.service';
import { SubprocesoService } from './subproceso.service';
import { RequerimientoService } from './requerimiento.service';
import { DiagramaService } from './diagrama.service';

export interface SpecsData {
    proyecto: any;
    miembros: any[];
    stakeholders: any[];
    procesos: any[];
    subprocesos: any[];
    requerimientos: any[];
    diagramas: any[];
}

@Injectable({
    providedIn: 'root'
})
export class SpecsService {

    constructor(
        private proyectoService: ProyectoService,
        private miembroService: MiembroService,
        private stakeholderService: StakeholderService,
        private procesoService: ProcesoService,
        private subprocesoService: SubprocesoService,
        private requerimientoService: RequerimientoService,
        private diagramaService: DiagramaService
    ) { }

    recopilarDatos(proyectoId: number): Observable<SpecsData> {
        return forkJoin({
            proyecto: this.proyectoService.obtener(proyectoId),
            miembros: this.miembroService.listarPorProyecto(proyectoId),
            stakeholders: this.stakeholderService.listarPorProyecto(proyectoId),
            procesos: this.procesoService.listarPorProyecto(proyectoId),
            diagramasMeta: this.diagramaService.listarPorProyecto(proyectoId)
        }).pipe(
            switchMap(base => {
                const diagCalls = base.diagramasMeta.map((d: any) =>
                    this.diagramaService.obtener(d.id)
                );
                const diagObs = diagCalls.length > 0 ? forkJoin(diagCalls) : of([]);

                return diagObs.pipe(
                    switchMap((diagramas: any) => {
                        const result = { ...base, diagramas: diagramas as any[] };

                        if (base.procesos.length === 0) {
                            return of({ ...result, subprocesos: [], requerimientos: [] });
                        }

                        const subCalls = base.procesos.map((p: any) =>
                            this.subprocesoService.listarPorProceso(p.id)
                        );

                        return forkJoin(subCalls).pipe(
                            switchMap((subArrays: any) => {
                                const allSubs: any[] = (subArrays as any[][]).flat();

                                if (allSubs.length === 0) {
                                    return of({ ...result, subprocesos: allSubs, requerimientos: [] });
                                }

                                const reqCalls = allSubs.map((s: any) =>
                                    this.requerimientoService.listarPorSubproceso(s.id)
                                );

                                return forkJoin(reqCalls).pipe(
                                    map((reqArrays: any) => ({
                                        ...result,
                                        subprocesos: allSubs,
                                        requerimientos: (reqArrays as any[][]).flat()
                                    }))
                                );
                            })
                        );
                    })
                );
            })
        );
    }
}
