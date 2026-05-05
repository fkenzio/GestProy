import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DiagramaService } from '../../compartidos/servicios/diagrama.service';

interface Lifeline {
    id: string;
    type: 'actor' | 'object';
    x: number;
    name: string;
}

interface Message {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'sync' | 'async' | 'return';
    y: number; 
    name: string;
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
    selector: 'app-editor-secuencia',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './editor-secuencia.html',
    styleUrl: './editor-secuencia.css',
    encapsulation: ViewEncapsulation.None
})
export class EditorSecuenciaComponent implements AfterViewInit, OnDestroy {

    @ViewChild('svgCanvas') svgCanvas!: ElementRef<SVGSVGElement>;

    diagramaId = 0;
    proyectoId = 0;
    nombreDiagrama = signal('');
    tipoDiagrama = signal('');
    guardando = signal(false);
    guardadoExitoso = signal(false);

    lifelines = signal<Lifeline[]>([]);
    messages = signal<Message[]>([]);
    notes = signal<Note[]>([]);
    
    lifelineSeleccionada = signal<Lifeline | null>(null);
    messageSeleccionado = signal<Message | null>(null);
    noteSeleccionada = signal<Note | null>(null);

    arrastrandoLifeline = false;
    arrastrandoMessage = false;
    arrastrandoNote = false;
    offsetX = 0;
    offsetY = 0;

    modoConexion = signal(false);
    tipoConexionActual = signal('sync');
    conexionOrigen = signal<Lifeline | null>(null);

    viewBoxX = 0;
    viewBoxY = 0;
    viewBoxW = 1200;
    viewBoxH = 800;
    zoom = 1;
    panActivo = false;
    panStartX = 0;
    panStartY = 0;

    minimapArrastrando = false;

    contadorLifelines = 0;
    contadorMessages = 0;

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
                const datos = d.datos || { lifelines: [], messages: [], notes: [] };
                this.lifelines.set(datos.lifelines || []);
                this.messages.set(datos.messages || []);
                this.notes.set(datos.notes || []);
                this.contadorLifelines = this.lifelines().length;
                this.contadorMessages = this.messages().length;
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

    onCanvasMouseDown(event: MouseEvent): void {
        if (event.button !== 0) return;
        if (this.modoConexion()) {
            this.cancelarConexion();
            return;
        }

        this.lifelineSeleccionada.set(null);
        this.messageSeleccionado.set(null);
        this.noteSeleccionada.set(null);
        this.panActivo = true;
        this.panStartX = event.clientX;
        this.panStartY = event.clientY;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onLifelineMouseDown(event: MouseEvent, ll: Lifeline): void {
        event.stopPropagation();

        if (this.modoConexion()) {
            this.manejarClickConexion(ll);
            return;
        }

        this.lifelineSeleccionada.set(ll);
        this.messageSeleccionado.set(null);
        this.noteSeleccionada.set(null);
        this.arrastrandoLifeline = true;

        const svg = this.svgCanvas.nativeElement;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

        this.offsetX = svgPt.x - ll.x;

        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onMessageMouseDown(event: MouseEvent, msg: Message): void {
        event.stopPropagation();
        this.messageSeleccionado.set(msg);
        this.lifelineSeleccionada.set(null);
        this.noteSeleccionada.set(null);
        this.arrastrandoMessage = true;

        const svg = this.svgCanvas.nativeElement;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

        this.offsetY = svgPt.y - msg.y;

        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onNoteMouseDown(event: MouseEvent, note: Note): void {
        event.stopPropagation();
        this.noteSeleccionada.set(note);
        this.lifelineSeleccionada.set(null);
        this.messageSeleccionado.set(null);
        this.arrastrandoNote = true;

        const svg = this.svgCanvas.nativeElement;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

        this.offsetX = svgPt.x - note.x;
        this.offsetY = svgPt.y - note.y;

        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
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

        if (this.arrastrandoLifeline) {
            const svg = this.svgCanvas.nativeElement;
            const pt = svg.createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

            const ll = this.lifelineSeleccionada();
            if (ll) {
                ll.x = svgPt.x - this.offsetX;
                this.lifelines.set([...this.lifelines()]);
            }
        }

        if (this.arrastrandoMessage) {
            const svg = this.svgCanvas.nativeElement;
            const pt = svg.createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

            const msg = this.messageSeleccionado();
            if (msg) {
                msg.y = svgPt.y - this.offsetY;
                this.messages.set([...this.messages()]);
            }
        }

        if (this.arrastrandoNote) {
            const svg = this.svgCanvas.nativeElement;
            const pt = svg.createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

            const note = this.noteSeleccionada();
            if (note) {
                note.x = svgPt.x - this.offsetX;
                note.y = svgPt.y - this.offsetY;
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
        this.arrastrandoLifeline = false;
        this.arrastrandoMessage = false;
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

    // --- Lifelines ---

    agregarLifeline(tipo: 'actor' | 'object'): void {
        this.contadorLifelines++;
        const id = `ll_${Date.now()}`;
        const nueva: Lifeline = {
            id,
            type: tipo,
            x: this.viewBoxX + this.viewBoxW / 2 - 50 + (this.contadorLifelines * 20),
            name: tipo === 'actor' ? `Actor ${this.contadorLifelines}` : `Objeto ${this.contadorLifelines}`
        };
        this.lifelines.set([...this.lifelines(), nueva]);
        this.lifelineSeleccionada.set(nueva);
        this.messageSeleccionado.set(null);
        this.noteSeleccionada.set(null);
    }

    agregarNota(): void {
        const id = `note_${Date.now()}`;
        const nueva: Note = {
            id,
            x: this.viewBoxX + this.viewBoxW / 2 - 100,
            y: this.viewBoxY + this.viewBoxH / 2 - 50,
            width: 180,
            height: 100,
            text: 'Escribe aquí tu nota...'
        };
        this.notes.set([...this.notes(), nueva]);
        this.noteSeleccionada.set(nueva);
        this.lifelineSeleccionada.set(null);
        this.messageSeleccionado.set(null);
    }

    eliminarElemento(): void {
        const llSel = this.lifelineSeleccionada();
        if (llSel) {
            this.lifelines.set(this.lifelines().filter(l => l.id !== llSel.id));
            this.messages.set(this.messages().filter(m => m.sourceId !== llSel.id && m.targetId !== llSel.id));
            this.lifelineSeleccionada.set(null);
            return;
        }

        const msgSel = this.messageSeleccionado();
        if (msgSel) {
            this.messages.set(this.messages().filter(m => m.id !== msgSel.id));
            this.messageSeleccionado.set(null);
            return;
        }

        const noteSel = this.noteSeleccionada();
        if (noteSel) {
            this.notes.set(this.notes().filter(n => n.id !== noteSel.id));
            this.noteSeleccionada.set(null);
        }
    }

    // --- Mensajes ---

    activarModoConexion(tipo: string): void {
        this.modoConexion.set(true);
        this.tipoConexionActual.set(tipo);
        this.conexionOrigen.set(null);
    }

    cancelarConexion(): void {
        this.modoConexion.set(false);
        this.conexionOrigen.set(null);
    }

    manejarClickConexion(ll: Lifeline): void {
        if (!this.conexionOrigen()) {
            this.conexionOrigen.set(ll);
        } else {
            const origen = this.conexionOrigen()!;
            if (origen.id === ll.id) return; // Mismo origen y destino, opcionalmente permitido pero lo evitamos por simplicidad.

            this.contadorMessages++;
            const nueva: Message = {
                id: `msg_${Date.now()}`,
                type: this.tipoConexionActual() as any,
                sourceId: origen.id,
                targetId: ll.id,
                y: this.viewBoxY + this.viewBoxH / 2 + (this.contadorMessages * 10),
                name: `mensaje${this.contadorMessages}()`
            };
            this.messages.set([...this.messages(), nueva]);
            this.messageSeleccionado.set(nueva);
            this.modoConexion.set(false);
            this.conexionOrigen.set(null);
        }
    }

    getLifelineX(id: string): number {
        const ll = this.lifelines().find(l => l.id === id);
        return ll ? ll.x : 0;
    }

    getMarker(tipo: string): string {
        switch (tipo) {
            case 'sync': return 'url(#arrowFilled)';
            case 'async': return 'url(#arrowOpen)';
            case 'return': return 'url(#arrowOpen)';
            default: return 'url(#arrowFilled)';
        }
    }

    getDashArray(tipo: string): string {
        return tipo === 'return' ? '5,5' : 'none';
    }

    // --- Propiedades ---

    actualizarNombreLifeline(nombre: string): void {
        const sel = this.lifelineSeleccionada();
        if (!sel) return;
        sel.name = nombre;
        this.lifelines.set([...this.lifelines()]);
    }

    actualizarNombreMensaje(nombre: string): void {
        const sel = this.messageSeleccionado();
        if (!sel) return;
        sel.name = nombre;
        this.messages.set([...this.messages()]);
    }

    actualizarTipoMensaje(tipo: any): void {
        const sel = this.messageSeleccionado();
        if (!sel) return;
        sel.type = tipo;
        this.messages.set([...this.messages()]);
    }

    actualizarTextoNota(texto: string): void {
        const sel = this.noteSeleccionada();
        if (!sel) return;
        sel.text = texto;
        this.notes.set([...this.notes()]);
    }

    volver(): void {
        this.router.navigate(['/proyectos', this.proyectoId]);
    }

    guardarDiagrama(): void {
        this.guardando.set(true);
        this.guardadoExitoso.set(false);

        const datosG = {
            lifelines: this.lifelines(),
            messages: this.messages(),
            notes: this.notes()
        };

        this.diagramaService.actualizar(this.diagramaId, {
            nombre: this.nombreDiagrama(),
            datos: datosG
        }).subscribe({
                next: () => {
                    this.guardando.set(false);
                    this.guardadoExitoso.set(true);
                    setTimeout(() => this.guardadoExitoso.set(false), 3000);
                },
                error: () => {
                    this.guardando.set(false);
                    alert('Error al guardar diagrama');
                }
            });
    }

    onMinimapMouseDown(event: MouseEvent): void {
        this.minimapArrastrando = true;
        this.onMouseMove(event);
    }
}
