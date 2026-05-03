import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DiagramaService } from '../../compartidos/servicios/diagrama.service';

interface ClaseElemento {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    data: {
        name: string;
        attributes: { visibility: string; name: string; type: string }[];
        methods: { visibility: string; name: string; params: string; returnType: string }[];
    };
}

interface Conexion {
    id: string;
    type: string;
    sourceId: string;
    targetId: string;
}

@Component({
    selector: 'app-editor-diagrama',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './editor-diagrama.html',
    styleUrl: './editor-diagrama.css'
})
export class EditorDiagramaComponent implements AfterViewInit, OnDestroy {

    @ViewChild('svgCanvas') svgCanvas!: ElementRef<SVGSVGElement>;

    diagramaId = 0;
    proyectoId = 0;
    nombreDiagrama = signal('');
    tipoDiagrama = signal('');
    guardando = signal(false);
    guardadoExitoso = signal(false);

    elementos = signal<ClaseElemento[]>([]);
    conexiones = signal<Conexion[]>([]);
    elementoSeleccionado = signal<ClaseElemento | null>(null);
    conexionSeleccionada = signal<Conexion | null>(null);

    // estado del drag
    arrastrando = false;
    arrastrandoDesdeToolbar = false;
    offsetX = 0;
    offsetY = 0;

    // estado de conexion
    modoConexion = signal(false);
    tipoConexionActual = signal('asociacion');
    conexionOrigen = signal<ClaseElemento | null>(null);

    // pan y zoom
    viewBoxX = 0;
    viewBoxY = 0;
    viewBoxW = 1200;
    viewBoxH = 800;
    zoom = 1;
    panActivo = false;
    panStartX = 0;
    panStartY = 0;

    // panel propiedades
    nuevoAtributo = signal({ visibility: '+', name: '', type: '' });
    nuevoMetodo = signal({ visibility: '+', name: '', params: '', returnType: 'void' });

    contadorElementos = 0;
    contadorConexiones = 0;

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
                const datos = d.datos || { elements: [], connections: [] };
                this.elementos.set(datos.elements || []);
                this.conexiones.set(datos.connections || []);
                this.contadorElementos = this.elementos().length;
                this.contadorConexiones = this.conexiones().length;
            },
            error: () => this.volver()
        });
    }

    ngOnDestroy(): void {
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
    }

    // --- Canvas ---

    getViewBox(): string {
        return `${this.viewBoxX} ${this.viewBoxY} ${this.viewBoxW} ${this.viewBoxH}`;
    }

    onCanvasMouseDown(event: MouseEvent): void {
        if (event.button !== 0) return;
        if (this.modoConexion()) return;

        const target = event.target as Element;
        if (target.tagName === 'svg' || target.classList.contains('canvas-bg')) {
            this.elementoSeleccionado.set(null);
            this.conexionSeleccionada.set(null);
            this.panActivo = true;
            this.panStartX = event.clientX;
            this.panStartY = event.clientY;
            document.addEventListener('mousemove', this.boundMouseMove);
            document.addEventListener('mouseup', this.boundMouseUp);
        }
    }

    onElementMouseDown(event: MouseEvent, elem: ClaseElemento): void {
        event.stopPropagation();

        if (this.modoConexion()) {
            this.manejarClickConexion(elem);
            return;
        }

        this.elementoSeleccionado.set(elem);
        this.conexionSeleccionada.set(null);
        this.arrastrando = true;

        const svg = this.svgCanvas.nativeElement;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

        this.offsetX = svgPt.x - elem.x;
        this.offsetY = svgPt.y - elem.y;

        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onMouseMove(event: MouseEvent): void {
        if (this.arrastrando) {
            const svg = this.svgCanvas.nativeElement;
            const pt = svg.createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());

            const elem = this.elementoSeleccionado();
            if (elem) {
                elem.x = svgPt.x - this.offsetX;
                elem.y = svgPt.y - this.offsetY;
                this.elementos.set([...this.elementos()]);
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
        this.arrastrando = false;
        this.panActivo = false;
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
    }

    onWheel(event: WheelEvent): void {
        event.preventDefault();
        const factor = event.deltaY > 0 ? 1.1 : 0.9;
        this.viewBoxW *= factor;
        this.viewBoxH *= factor;
        this.zoom = 1200 / this.viewBoxW;
    }

    // --- Elementos ---

    agregarClase(): void {
        this.contadorElementos++;
        const id = `cls_${Date.now()}`;
        const nueva: ClaseElemento = {
            id,
            x: this.viewBoxX + this.viewBoxW / 2 - 100,
            y: this.viewBoxY + this.viewBoxH / 2 - 60,
            width: 200,
            height: 120,
            data: {
                name: `Clase${this.contadorElementos}`,
                attributes: [],
                methods: []
            }
        };
        this.elementos.set([...this.elementos(), nueva]);
        this.elementoSeleccionado.set(nueva);
        this.conexionSeleccionada.set(null);
    }

    eliminarElemento(): void {
        const sel = this.elementoSeleccionado();
        if (!sel) return;
        this.elementos.set(this.elementos().filter(e => e.id !== sel.id));
        this.conexiones.set(this.conexiones().filter(c => c.sourceId !== sel.id && c.targetId !== sel.id));
        this.elementoSeleccionado.set(null);
    }

    calcularAltura(elem: ClaseElemento): number {
        const headerH = 32;
        const attrH = Math.max(elem.data.attributes.length * 20, 20);
        const methodH = Math.max(elem.data.methods.length * 20, 20);
        return headerH + attrH + methodH + 8;
    }

    attrYOffset(elem: ClaseElemento): number {
        return 32;
    }

    methodYOffset(elem: ClaseElemento): number {
        return 32 + Math.max(elem.data.attributes.length * 20, 20);
    }

    // --- Conexiones ---

    activarModoConexion(tipo: string): void {
        this.modoConexion.set(true);
        this.tipoConexionActual.set(tipo);
        this.conexionOrigen.set(null);
    }

    cancelarConexion(): void {
        this.modoConexion.set(false);
        this.conexionOrigen.set(null);
    }

    manejarClickConexion(elem: ClaseElemento): void {
        if (!this.conexionOrigen()) {
            this.conexionOrigen.set(elem);
        } else {
            const origen = this.conexionOrigen()!;
            if (origen.id === elem.id) return;

            this.contadorConexiones++;
            const nueva: Conexion = {
                id: `conn_${Date.now()}`,
                type: this.tipoConexionActual(),
                sourceId: origen.id,
                targetId: elem.id
            };
            this.conexiones.set([...this.conexiones(), nueva]);
            this.modoConexion.set(false);
            this.conexionOrigen.set(null);
        }
    }

    seleccionarConexion(conn: Conexion, event: MouseEvent): void {
        event.stopPropagation();
        this.conexionSeleccionada.set(conn);
        this.elementoSeleccionado.set(null);
    }

    eliminarConexion(): void {
        const sel = this.conexionSeleccionada();
        if (!sel) return;
        this.conexiones.set(this.conexiones().filter(c => c.id !== sel.id));
        this.conexionSeleccionada.set(null);
    }

    getSourceCenter(conn: Conexion): { x: number; y: number } {
        const elem = this.elementos().find(e => e.id === conn.sourceId);
        if (!elem) return { x: 0, y: 0 };
        return { x: elem.x + elem.width / 2, y: elem.y + this.calcularAltura(elem) / 2 };
    }

    getTargetCenter(conn: Conexion): { x: number; y: number } {
        const elem = this.elementos().find(e => e.id === conn.targetId);
        if (!elem) return { x: 0, y: 0 };
        return { x: elem.x + elem.width / 2, y: elem.y + this.calcularAltura(elem) / 2 };
    }

    getConexionColor(tipo: string): string {
        switch (tipo) {
            case 'herencia': return '#2563eb';
            case 'composicion': return '#dc2626';
            case 'agregacion': return '#059669';
            case 'dependencia': return '#7c3aed';
            default: return '#374151';
        }
    }

    getMarker(tipo: string): string {
        switch (tipo) {
            case 'herencia': return 'url(#arrowTriangle)';
            case 'composicion': return 'url(#arrowDiamond)';
            case 'agregacion': return 'url(#arrowDiamondOpen)';
            case 'dependencia': return 'url(#arrowOpen)';
            default: return 'url(#arrowOpen)';
        }
    }

    // --- Propiedades ---

    actualizarNombreClase(nombre: string): void {
        const sel = this.elementoSeleccionado();
        if (!sel) return;
        sel.data.name = nombre;
        this.elementos.set([...this.elementos()]);
    }

    agregarAtributo(): void {
        const sel = this.elementoSeleccionado();
        const attr = this.nuevoAtributo();
        if (!sel || !attr.name) return;
        sel.data.attributes.push({ visibility: attr.visibility, name: attr.name, type: attr.type || 'String' });
        this.nuevoAtributo.set({ visibility: '+', name: '', type: '' });
        this.elementos.set([...this.elementos()]);
    }

    eliminarAtributo(index: number): void {
        const sel = this.elementoSeleccionado();
        if (!sel) return;
        sel.data.attributes.splice(index, 1);
        this.elementos.set([...this.elementos()]);
    }

    agregarMetodo(): void {
        const sel = this.elementoSeleccionado();
        const met = this.nuevoMetodo();
        if (!sel || !met.name) return;
        sel.data.methods.push({
            visibility: met.visibility,
            name: met.name,
            params: met.params || '',
            returnType: met.returnType || 'void'
        });
        this.nuevoMetodo.set({ visibility: '+', name: '', params: '', returnType: 'void' });
        this.elementos.set([...this.elementos()]);
    }

    eliminarMetodo(index: number): void {
        const sel = this.elementoSeleccionado();
        if (!sel) return;
        sel.data.methods.splice(index, 1);
        this.elementos.set([...this.elementos()]);
    }

    // --- Guardar ---

    guardar(): void {
        this.guardando.set(true);
        this.guardadoExitoso.set(false);

        this.diagramaService.actualizar(this.diagramaId, {
            nombre: this.nombreDiagrama(),
            datos: {
                elements: this.elementos(),
                connections: this.conexiones()
            }
        }).subscribe({
            next: () => {
                this.guardando.set(false);
                this.guardadoExitoso.set(true);
                setTimeout(() => this.guardadoExitoso.set(false), 2000);
            },
            error: () => this.guardando.set(false)
        });
    }

    volver(): void {
        this.router.navigate(['/proyectos', this.proyectoId]);
    }

    resetView(): void {
        this.viewBoxX = 0;
        this.viewBoxY = 0;
        this.viewBoxW = 1200;
        this.viewBoxH = 800;
        this.zoom = 1;
    }
}
