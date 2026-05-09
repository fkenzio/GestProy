import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DiagramaService } from '../../compartidos/servicios/diagrama.service';

interface UCactor {
    id: string;
    x: number;
    y: number;
    name: string;
}

interface UseCase {
    id: string;
    x: number;
    y: number;
    name: string;
}

interface SystemBound {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
}

interface Relation {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'association' | 'include' | 'extend' | 'generalization';
}

interface Note {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
}

@Component({
    selector: 'app-editor-casos-uso',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './editor-casos-uso.html',
    styleUrl: './editor-casos-uso.css',
    encapsulation: ViewEncapsulation.None
})
export class EditorCasosUsoComponent implements AfterViewInit, OnDestroy {

    @ViewChild('svgCanvas') svgCanvas!: ElementRef<SVGSVGElement>;

    diagramaId = 0;
    proyectoId = 0;
    nombreDiagrama = signal('');
    tipoDiagrama = signal('');
    guardando = signal(false);
    guardadoExitoso = signal(false);
    cambiosSinGuardar = signal(false);
    mostrarModalSalir = signal(false);

    actors = signal<UCactor[]>([]);
    useCases = signal<UseCase[]>([]);
    systemBounds = signal<SystemBound[]>([]);
    relations = signal<Relation[]>([]);
    notes = signal<Note[]>([]);

    actorSeleccionado = signal<UCactor | null>(null);
    useCaseSeleccionado = signal<UseCase | null>(null);
    boundSeleccionado = signal<SystemBound | null>(null);
    relationSeleccionada = signal<Relation | null>(null);
    noteSeleccionada = signal<Note | null>(null);

    arrastrandoActor = false;
    arrastrandoUseCase = false;
    arrastrandoBound = false;
    arrastrandoNote = false;
    offsetX = 0;
    offsetY = 0;

    modoConexion = signal(false);
    tipoConexionActual = signal('association');
    conexionOrigen = signal<{ id: string } | null>(null);

    viewBoxX = 0;
    viewBoxY = 0;
    viewBoxW = 1200;
    viewBoxH = 800;
    zoom = 1;
    panActivo = false;
    panStartX = 0;
    panStartY = 0;
    minimapArrastrando = false;

    contadorActors = 0;
    contadorUseCases = 0;
    contadorBounds = 0;

    Math = Math;

    private boundMouseMove: any;
    private boundMouseUp: any;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private diagramaService: DiagramaService
    ) { }

    ngAfterViewInit(): void {
        this.proyectoId = Number(this.route.snapshot.paramMap.get('id'));
        this.diagramaId = Number(this.route.snapshot.paramMap.get('diagramaId'));

        this.boundMouseMove = this.onMouseMove.bind(this);
        this.boundMouseUp = this.onMouseUp.bind(this);

        this.diagramaService.obtener(this.diagramaId).subscribe({
            next: (d) => {
                this.nombreDiagrama.set(d.nombre);
                this.tipoDiagrama.set(d.tipo);
                const datos = d.datos || {};
                this.actors.set(datos.actors || []);
                this.useCases.set(datos.useCases || []);
                this.systemBounds.set(datos.systemBounds || []);
                this.relations.set(datos.relations || []);
                this.notes.set(datos.notes || []);
                this.contadorActors = this.actors().length;
                this.contadorUseCases = this.useCases().length;
                this.contadorBounds = this.systemBounds().length;
            },
            error: () => this.volver()
        });
    }

    ngOnDestroy(): void {
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
    }

    getViewBox(): string {
        return `${this.viewBoxX} ${this.viewBoxY} ${this.viewBoxW} ${this.viewBoxH}`;
    }

    limpiarSeleccion(): void {
        this.actorSeleccionado.set(null);
        this.useCaseSeleccionado.set(null);
        this.boundSeleccionado.set(null);
        this.relationSeleccionada.set(null);
        this.noteSeleccionada.set(null);
    }

    onCanvasMouseDown(event: MouseEvent): void {
        if (event.button !== 0) return;
        if (this.modoConexion()) {
            this.cancelarConexion();
            return;
        }
        this.limpiarSeleccion();
        this.panActivo = true;
        this.panStartX = event.clientX;
        this.panStartY = event.clientY;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onActorMouseDown(event: MouseEvent, actor: UCactor): void {
        event.stopPropagation();
        if (this.modoConexion()) {
            this.manejarClickConexion(actor.id);
            return;
        }
        this.limpiarSeleccion();
        this.actorSeleccionado.set(actor);
        this.arrastrandoActor = true;
        const svgPt = this.clientToSVG(event);
        this.offsetX = svgPt.x - actor.x;
        this.offsetY = svgPt.y - actor.y;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onUseCaseMouseDown(event: MouseEvent, uc: UseCase): void {
        event.stopPropagation();
        if (this.modoConexion()) {
            this.manejarClickConexion(uc.id);
            return;
        }
        this.limpiarSeleccion();
        this.useCaseSeleccionado.set(uc);
        this.arrastrandoUseCase = true;
        const svgPt = this.clientToSVG(event);
        this.offsetX = svgPt.x - uc.x;
        this.offsetY = svgPt.y - uc.y;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onBoundMouseDown(event: MouseEvent, bound: SystemBound): void {
        event.stopPropagation();
        if (this.modoConexion()) return;
        this.limpiarSeleccion();
        this.boundSeleccionado.set(bound);
        this.arrastrandoBound = true;
        const svgPt = this.clientToSVG(event);
        this.offsetX = svgPt.x - bound.x;
        this.offsetY = svgPt.y - bound.y;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onRelationMouseDown(event: MouseEvent, rel: Relation): void {
        event.stopPropagation();
        this.limpiarSeleccion();
        this.relationSeleccionada.set(rel);
    }

    onNoteMouseDown(event: MouseEvent, note: Note): void {
        event.stopPropagation();
        this.limpiarSeleccion();
        this.noteSeleccionada.set(note);
        this.arrastrandoNote = true;
        const svgPt = this.clientToSVG(event);
        this.offsetX = svgPt.x - note.x;
        this.offsetY = svgPt.y - note.y;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    clientToSVG(event: MouseEvent): { x: number; y: number } {
        const svg = this.svgCanvas.nativeElement;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        return { x: svgPt.x, y: svgPt.y };
    }

    onMouseMove(event: MouseEvent): void {
        if (this.minimapArrastrando) {
            const svg = document.querySelector('.minimapa-svg') as SVGSVGElement;
            if (svg) {
                const pt = svg.createSVGPoint();
                pt.x = event.clientX;
                pt.y = event.clientY;
                const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
                this.viewBoxX = svgPt.x - this.viewBoxW / 2;
                this.viewBoxY = svgPt.y - this.viewBoxH / 2;
            }
            return;
        }

        const svgPt = this.clientToSVG(event);

        if (this.arrastrandoActor) {
            const a = this.actorSeleccionado();
            if (a) {
                a.x = svgPt.x - this.offsetX;
                a.y = svgPt.y - this.offsetY;
                this.actors.set([...this.actors()]);
            }
        }

        if (this.arrastrandoUseCase) {
            const uc = this.useCaseSeleccionado();
            if (uc) {
                uc.x = svgPt.x - this.offsetX;
                uc.y = svgPt.y - this.offsetY;
                this.useCases.set([...this.useCases()]);
            }
        }

        if (this.arrastrandoBound) {
            const b = this.boundSeleccionado();
            if (b) {
                b.x = svgPt.x - this.offsetX;
                b.y = svgPt.y - this.offsetY;
                this.systemBounds.set([...this.systemBounds()]);
            }
        }

        if (this.arrastrandoNote) {
            const n = this.noteSeleccionada();
            if (n) {
                n.x = svgPt.x - this.offsetX;
                n.y = svgPt.y - this.offsetY;
                this.notes.set([...this.notes()]);
            }
        }

        if (this.panActivo) {
            const dx = (event.clientX - this.panStartX) / this.zoom;
            const dy = (event.clientY - this.panStartY) / this.zoom;
            this.viewBoxX -= dx;
            this.viewBoxY -= dy;
            this.panStartX = event.clientX;
            this.panStartY = event.clientY;
        }
    }

    onMouseUp(): void {
        if (this.arrastrandoActor || this.arrastrandoUseCase || this.arrastrandoBound || this.arrastrandoNote) this.marcarCambio();
        this.arrastrandoActor = false;
        this.arrastrandoUseCase = false;
        this.arrastrandoBound = false;
        this.arrastrandoNote = false;
        this.panActivo = false;
        this.minimapArrastrando = false;
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
    }

    onWheel(event: WheelEvent): void {
        event.preventDefault();
        const factor = event.deltaY > 0 ? 1.1 : 0.9;
        const cx = this.viewBoxX + this.viewBoxW / 2;
        const cy = this.viewBoxY + this.viewBoxH / 2;
        this.viewBoxW *= factor;
        this.viewBoxH *= factor;
        this.viewBoxX = cx - this.viewBoxW / 2;
        this.viewBoxY = cy - this.viewBoxH / 2;
        this.zoom = 1200 / this.viewBoxW;
    }

    setZoomStr(val: string | number): void {
        const nuevoZoom = Number(val);
        if (isNaN(nuevoZoom) || nuevoZoom <= 0.1) return;
        const factor = this.zoom / nuevoZoom;
        const cx = this.viewBoxX + this.viewBoxW / 2;
        const cy = this.viewBoxY + this.viewBoxH / 2;
        this.viewBoxW *= factor;
        this.viewBoxH *= factor;
        this.viewBoxX = cx - this.viewBoxW / 2;
        this.viewBoxY = cy - this.viewBoxH / 2;
        this.zoom = nuevoZoom;
    }

    zoomIn(): void { this.setZoomStr(this.zoom + 0.1); }
    zoomOut(): void { this.setZoomStr(Math.max(0.2, this.zoom - 0.1)); }
    getZoomPercent(): number { return Math.round(this.zoom * 100); }

    // --- Agregar elementos ---

    agregarActor(): void {
        this.contadorActors++;
        const nuevo: UCactor = {
            id: `actor_${Date.now()}`,
            x: this.viewBoxX + this.viewBoxW / 2 - 25,
            y: this.viewBoxY + this.viewBoxH / 2 - 40,
            name: `Actor ${this.contadorActors}`
        };
        this.actors.set([...this.actors(), nuevo]);
        this.limpiarSeleccion();
        this.actorSeleccionado.set(nuevo);
        this.marcarCambio();
    }

    agregarCasoUso(): void {
        this.contadorUseCases++;
        const nuevo: UseCase = {
            id: `uc_${Date.now()}`,
            x: this.viewBoxX + this.viewBoxW / 2 - 70,
            y: this.viewBoxY + this.viewBoxH / 2 - 25,
            name: `Caso de Uso ${this.contadorUseCases}`
        };
        this.useCases.set([...this.useCases(), nuevo]);
        this.limpiarSeleccion();
        this.useCaseSeleccionado.set(nuevo);
        this.marcarCambio();
    }

    agregarLimiteSistema(): void {
        this.contadorBounds++;
        const nuevo: SystemBound = {
            id: `bound_${Date.now()}`,
            x: this.viewBoxX + this.viewBoxW / 2 - 200,
            y: this.viewBoxY + this.viewBoxH / 2 - 200,
            width: 400,
            height: 400,
            name: `Sistema ${this.contadorBounds}`
        };
        this.systemBounds.set([...this.systemBounds(), nuevo]);
        this.limpiarSeleccion();
        this.boundSeleccionado.set(nuevo);
        this.marcarCambio();
    }

    agregarNota(): void {
        const nueva: Note = {
            id: `note_${Date.now()}`,
            x: this.viewBoxX + this.viewBoxW / 2 - 90,
            y: this.viewBoxY + this.viewBoxH / 2 - 50,
            width: 180,
            height: 100,
            text: 'Escribe aquí tu nota...'
        };
        this.notes.set([...this.notes(), nueva]);
        this.limpiarSeleccion();
        this.noteSeleccionada.set(nueva);
        this.marcarCambio();
    }

    eliminarElemento(): void {
        const a = this.actorSeleccionado();
        if (a) {
            this.actors.set(this.actors().filter(x => x.id !== a.id));
            this.relations.set(this.relations().filter(r => r.sourceId !== a.id && r.targetId !== a.id));
            this.actorSeleccionado.set(null);
            this.marcarCambio();
            return;
        }
        const uc = this.useCaseSeleccionado();
        if (uc) {
            this.useCases.set(this.useCases().filter(x => x.id !== uc.id));
            this.relations.set(this.relations().filter(r => r.sourceId !== uc.id && r.targetId !== uc.id));
            this.useCaseSeleccionado.set(null);
            this.marcarCambio();
            return;
        }
        const b = this.boundSeleccionado();
        if (b) {
            this.systemBounds.set(this.systemBounds().filter(x => x.id !== b.id));
            this.boundSeleccionado.set(null);
            this.marcarCambio();
            return;
        }
        const r = this.relationSeleccionada();
        if (r) {
            this.relations.set(this.relations().filter(x => x.id !== r.id));
            this.relationSeleccionada.set(null);
            this.marcarCambio();
            return;
        }
        const n = this.noteSeleccionada();
        if (n) {
            this.notes.set(this.notes().filter(x => x.id !== n.id));
            this.noteSeleccionada.set(null);
            this.marcarCambio();
        }
    }

    // --- Relaciones ---

    activarModoConexion(tipo: string): void {
        this.modoConexion.set(true);
        this.tipoConexionActual.set(tipo);
        this.conexionOrigen.set(null);
    }

    cancelarConexion(): void {
        this.modoConexion.set(false);
        this.conexionOrigen.set(null);
    }

    manejarClickConexion(elementoId: string): void {
        if (!this.conexionOrigen()) {
            this.conexionOrigen.set({ id: elementoId });
        } else {
            const origenId = this.conexionOrigen()!.id;
            if (origenId === elementoId) return;

            const nueva: Relation = {
                id: `rel_${Date.now()}`,
                sourceId: origenId,
                targetId: elementoId,
                type: this.tipoConexionActual() as any
            };
            this.relations.set([...this.relations(), nueva]);
            this.limpiarSeleccion();
            this.relationSeleccionada.set(nueva);
            this.modoConexion.set(false);
            this.conexionOrigen.set(null);
            this.marcarCambio();
        }
    }

    getElementCenter(id: string): { x: number; y: number } {
        const actor = this.actors().find(a => a.id === id);
        if (actor) return { x: actor.x + 25, y: actor.y + 35 };

        const uc = this.useCases().find(u => u.id === id);
        if (uc) return { x: uc.x + 70, y: uc.y + 25 };

        return { x: 0, y: 0 };
    }

    getRelationLabel(type: string): string {
        switch (type) {
            case 'include': return '<<include>>';
            case 'extend': return '<<extend>>';
            default: return '';
        }
    }

    getRelationDash(type: string): string {
        return (type === 'include' || type === 'extend') ? '6,4' : 'none';
    }

    getRelationMarker(type: string): string {
        if (type === 'association') return '';
        if (type === 'generalization') return 'url(#arrowTriangle)';
        return 'url(#arrowOpen)';
    }

    // --- Propiedades ---

    actualizarNombre(nombre: string, tipo: string): void {
        if (tipo === 'actor') {
            const sel = this.actorSeleccionado();
            if (sel) { sel.name = nombre; this.actors.set([...this.actors()]); }
        } else if (tipo === 'useCase') {
            const sel = this.useCaseSeleccionado();
            if (sel) { sel.name = nombre; this.useCases.set([...this.useCases()]); }
        } else if (tipo === 'bound') {
            const sel = this.boundSeleccionado();
            if (sel) { sel.name = nombre; this.systemBounds.set([...this.systemBounds()]); }
        }
        this.marcarCambio();
    }

    actualizarBoundDimension(campo: 'width' | 'height', valor: string): void {
        const sel = this.boundSeleccionado();
        if (!sel) return;
        const num = Number(valor);
        if (isNaN(num) || num < 100) return;
        sel[campo] = num;
        this.systemBounds.set([...this.systemBounds()]);
        this.marcarCambio();
    }

    actualizarTipoRelacion(tipo: any): void {
        const sel = this.relationSeleccionada();
        if (!sel) return;
        sel.type = tipo;
        this.relations.set([...this.relations()]);
        this.marcarCambio();
    }

    actualizarTextoNota(texto: string): void {
        const sel = this.noteSeleccionada();
        if (!sel) return;
        sel.text = texto;
        this.notes.set([...this.notes()]);
        this.marcarCambio();
    }

    // --- Navegacion y guardado ---

    volver(): void {
        if (this.cambiosSinGuardar()) {
            this.mostrarModalSalir.set(true);
        } else {
            this.router.navigate(['/proyectos', this.proyectoId]);
        }
    }

    salirSinGuardar(): void {
        this.mostrarModalSalir.set(false);
        this.router.navigate(['/proyectos', this.proyectoId]);
    }

    marcarCambio(): void {
        this.cambiosSinGuardar.set(true);
    }

    guardarDiagrama(salirAlTerminar = false): void {
        this.guardando.set(true);
        this.guardadoExitoso.set(false);

        const datosG = {
            actors: this.actors(),
            useCases: this.useCases(),
            systemBounds: this.systemBounds(),
            relations: this.relations(),
            notes: this.notes()
        };

        this.diagramaService.actualizar(this.diagramaId, {
            nombre: this.nombreDiagrama(),
            datos: datosG
        }).subscribe({
            next: () => {
                this.guardando.set(false);
                this.guardadoExitoso.set(true);
                this.cambiosSinGuardar.set(false);
                if (salirAlTerminar) {
                    this.router.navigate(['/proyectos', this.proyectoId]);
                } else {
                    setTimeout(() => this.guardadoExitoso.set(false), 3000);
                }
            },
            error: () => {
                this.guardando.set(false);
                alert('Error al guardar diagrama');
            }
        });
    }

    resetView(): void {
        const allX: number[] = [];
        const allY: number[] = [];

        for (const a of this.actors()) { allX.push(a.x, a.x + 50); allY.push(a.y, a.y + 80); }
        for (const uc of this.useCases()) { allX.push(uc.x, uc.x + 140); allY.push(uc.y, uc.y + 50); }
        for (const b of this.systemBounds()) { allX.push(b.x, b.x + b.width); allY.push(b.y, b.y + b.height); }
        for (const n of this.notes()) { allX.push(n.x, n.x + n.width); allY.push(n.y, n.y + n.height); }

        if (allX.length === 0) {
            this.viewBoxX = 0; this.viewBoxY = 0; this.viewBoxW = 1200; this.viewBoxH = 800; this.zoom = 1;
            return;
        }

        const padding = 100;
        const minX = Math.min(...allX) - padding;
        const minY = Math.min(...allY) - padding;
        const maxX = Math.max(...allX) + padding;
        const maxY = Math.max(...allY) + padding;

        let w = Math.max(maxX - minX, 1200);
        let h = Math.max(maxY - minY, 800);
        const aspect = 1200 / 800;
        if (w / h > aspect) { h = w / aspect; } else { w = h * aspect; }

        this.viewBoxX = minX - (w - (maxX - minX)) / 2;
        this.viewBoxY = minY - (h - (maxY - minY)) / 2;
        this.viewBoxW = w;
        this.viewBoxH = h;
        this.zoom = 1200 / w;
    }

    onMinimapMouseDown(event: MouseEvent): void {
        this.minimapArrastrando = true;
        this.onMouseMove(event);
    }
}
