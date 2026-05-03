import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DiagramaService } from '../../compartidos/servicios/diagrama.service';

interface ElementoDiagrama {
    id: string;
    type: 'clase' | 'interfaz' | 'enum' | 'etiqueta' | 'paquete';
    x: number;
    y: number;
    width: number;
    height: number;
    data: {
        name: string;
        attributes: { visibility: string; name: string; type: string }[];
        methods: { visibility: string; name: string; params: string; returnType: string }[];
        values?: string[]; // Para enums
        text?: string;     // Para etiquetas
        packageId?: string; // ID del paquete padre
    };
}

interface Conexion {
    id: string;
    type: string;
    sourceId: string;
    targetId: string;
    sourceMulti: string;
    targetMulti: string;
}

@Component({
    selector: 'app-editor-diagrama',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './editor-diagrama.html',
    styleUrl: './editor-diagrama.css',
    encapsulation: ViewEncapsulation.None
})
export class EditorDiagramaComponent implements AfterViewInit, OnDestroy {

    @ViewChild('svgCanvas') svgCanvas!: ElementRef<SVGSVGElement>;

    diagramaId = 0;
    proyectoId = 0;
    nombreDiagrama = signal('');
    tipoDiagrama = signal('');
    guardando = signal(false);
    guardadoExitoso = signal(false);

    elementos = signal<ElementoDiagrama[]>([]);
    conexiones = signal<Conexion[]>([]);
    elementoSeleccionado = signal<ElementoDiagrama | null>(null);
    conexionSeleccionada = signal<Conexion | null>(null);

    // estado del drag
    arrastrando = false;
    arrastrandoDesdeToolbar = false;
    offsetX = 0;
    offsetY = 0;

    // estado de conexion
    modoConexion = signal(false);
    tipoConexionActual = signal('asociacion');
    conexionOrigen = signal<ElementoDiagrama | null>(null);

    // pan y zoom
    viewBoxX = 0;
    viewBoxY = 0;
    viewBoxW = 1200;
    viewBoxH = 800;
    zoom = 1;
    panActivo = false;
    panStartX = 0;
    panStartY = 0;

    // minimapa
    minimapArrastrando = false;

    // panel propiedades
    nuevoAtributo = signal({ visibility: '+', name: '', type: '' });
    nuevoMetodo = signal({ visibility: '+', name: '', params: '', returnType: 'void' });
    nuevoValorEnum = signal('');

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
        if (this.modoConexion()) {
            this.cancelarConexion();
            return;
        }

        this.elementoSeleccionado.set(null);
        this.conexionSeleccionada.set(null);
        this.panActivo = true;
        this.panStartX = event.clientX;
        this.panStartY = event.clientY;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onElementMouseDown(event: MouseEvent, elem: ElementoDiagrama): void {
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
        this.minimapArrastrando = false;
        document.removeEventListener('mousemove', this.boundMouseMove);
        document.removeEventListener('mouseup', this.boundMouseUp);
    }

    onWheel(event: WheelEvent): void {
        event.preventDefault();
        const factor = event.deltaY > 0 ? 1.1 : 0.9;
        
        // Centrar el zoom
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

    zoomIn(): void {
        this.setZoomStr(this.zoom + 0.1);
    }

    zoomOut(): void {
        this.setZoomStr(Math.max(0.2, this.zoom - 0.1));
    }

    getZoomPercent(): number {
        return Math.round(this.zoom * 100);
    }

    // --- Elementos ---

    getPaquetes() {
        return this.elementos().filter(e => e.type === 'paquete');
    }

    getPaqueteNombre(pkgId: string | undefined): string {
        if (!pkgId) return '';
        const pkg = this.elementos().find(e => e.id === pkgId);
        return pkg ? pkg.data.name : '';
    }

    agregarElemento(tipo: 'clase' | 'interfaz' | 'enum' | 'etiqueta' | 'paquete'): void {
        this.contadorElementos++;
        const id = `${tipo}_${Date.now()}`;
        const nueva: ElementoDiagrama = {
            id,
            type: tipo,
            x: this.viewBoxX + this.viewBoxW / 2 - 100,
            y: this.viewBoxY + this.viewBoxH / 2 - 60,
            width: tipo === 'etiqueta' ? 150 : 200,
            height: tipo === 'etiqueta' ? 100 : 120,
            data: {
                name: tipo === 'clase' ? `Clase${this.contadorElementos}` : 
                      tipo === 'interfaz' ? `Interfaz${this.contadorElementos}` : 
                      tipo === 'enum' ? `Enum${this.contadorElementos}` : 
                      tipo === 'paquete' ? `Paquete${this.contadorElementos}` : '',
                attributes: [],
                methods: [],
                values: tipo === 'enum' ? ['VALOR_1', 'VALOR_2'] : [],
                text: tipo === 'etiqueta' ? 'Escribe aquí tu nota...' : ''
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

    calcularAltura(elem: ElementoDiagrama): number {
        if (elem.type === 'etiqueta') return elem.height;
        if (elem.type === 'paquete') return 120; // Default height, could be calculated based on children

        const headerH = 32;
        if (elem.type === 'enum') {
            return headerH + Math.max((elem.data.values?.length || 0) * 20, 20) + 8;
        }

        const attrH = elem.type === 'interfaz' ? 0 : Math.max(elem.data.attributes.length * 20, 20);
        const methodH = Math.max(elem.data.methods.length * 20, 20);
        return headerH + attrH + methodH + 8;
    }

    attrYOffset(elem: ElementoDiagrama): number {
        return 32;
    }

    methodYOffset(elem: ElementoDiagrama): number {
        if (elem.type === 'interfaz') return 32;
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

    manejarClickConexion(elem: ElementoDiagrama): void {
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
                targetId: elem.id,
                sourceMulti: '1',
                targetMulti: '*'
            };
            this.conexiones.set([...this.conexiones(), nueva]);
            this.conexionSeleccionada.set(nueva);
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

    getEdgePoint(elemId: string, otherElemId: string): { x: number; y: number } {
        const elem = this.elementos().find(e => e.id === elemId);
        const other = this.elementos().find(e => e.id === otherElemId);
        if (!elem || !other) return { x: 0, y: 0 };

        const h = this.calcularAltura(elem);
        const cx = elem.x + elem.width / 2;
        const cy = elem.y + h / 2;
        const ox = other.x + other.width / 2;
        const oy = other.y + this.calcularAltura(other) / 2;

        const dx = ox - cx;
        const dy = oy - cy;

        const hw = elem.width / 2;
        const hh = h / 2;

        if (dx === 0 && dy === 0) return { x: cx, y: cy };

        const sx = Math.abs(dy * hw) < Math.abs(dx * hh)
            ? (dx > 0 ? hw : -hw)
            : (dx * hh / Math.abs(dy));
        const sy = Math.abs(dy * hw) < Math.abs(dx * hh)
            ? (dy * hw / Math.abs(dx))
            : (dy > 0 ? hh : -hh);

        return { x: cx + sx, y: cy + sy };
    }

    getSourcePoint(conn: Conexion): { x: number; y: number } {
        return this.getEdgePoint(conn.sourceId, conn.targetId);
    }

    getTargetPoint(conn: Conexion): { x: number; y: number } {
        return this.getEdgePoint(conn.targetId, conn.sourceId);
    }

    getMultiPos(conn: Conexion, side: string): { x: number; y: number } {
        const src = this.getSourcePoint(conn);
        const tgt = this.getTargetPoint(conn);
        const t = 0.15;
        if (side === 'source') return { x: src.x + (tgt.x - src.x) * t, y: src.y + (tgt.y - src.y) * t - 8 };
        return { x: tgt.x + (src.x - tgt.x) * t, y: tgt.y + (src.y - tgt.y) * t - 8 };
    }

    actualizarMultiplicidad(conn: Conexion, side: string, valor: string): void {
        if (side === 'source') conn.sourceMulti = valor;
        else conn.targetMulti = valor;
        this.conexiones.set([...this.conexiones()]);
    }

    getConexionColor(tipo: string): string {
        return '#000000';
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

    actualizarPaquete(pkgId: string | undefined): void {
        const sel = this.elementoSeleccionado();
        if (!sel) return;
        sel.data.packageId = pkgId;
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

    agregarValorEnum(): void {
        const sel = this.elementoSeleccionado();
        const val = this.nuevoValorEnum().trim();
        if (!sel || !val || sel.type !== 'enum') return;
        if (!sel.data.values) sel.data.values = [];
        sel.data.values.push(val);
        this.nuevoValorEnum.set('');
        this.elementos.set([...this.elementos()]);
    }

    eliminarValorEnum(index: number): void {
        const sel = this.elementoSeleccionado();
        if (!sel || sel.type !== 'enum' || !sel.data.values) return;
        sel.data.values.splice(index, 1);
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
        if (this.elementos().length === 0) {
            this.viewBoxX = 0;
            this.viewBoxY = 0;
            this.viewBoxW = 1200;
            this.viewBoxH = 800;
            this.zoom = 1;
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of this.elementos()) {
            if (el.x < minX) minX = el.x;
            if (el.y < minY) minY = el.y;
            if (el.x + el.width > maxX) maxX = el.x + el.width;
            if (el.y + this.calcularAltura(el) > maxY) maxY = el.y + this.calcularAltura(el);
        }

        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const w = Math.max(maxX - minX, 1200);
        const h = Math.max(maxY - minY, 800);

        const aspectCanvas = 1200 / 800;
        const aspectContent = w / h;

        let finalW = w;
        let finalH = h;

        if (aspectContent > aspectCanvas) {
            finalH = w / aspectCanvas;
        } else {
            finalW = h * aspectCanvas;
        }

        this.viewBoxX = minX - (finalW - (maxX - minX)) / 2;
        this.viewBoxY = minY - (finalH - (maxY - minY)) / 2;
        this.viewBoxW = finalW;
        this.viewBoxH = finalH;
        this.zoom = 1200 / finalW;
    }

    getVisibilidadColor(vis: string): string {
        switch(vis) {
            case '+': return '#10b981'; // verde
            case '-': return '#ef4444'; // rojo
            case '#': return '#f59e0b'; // naranja
            case '/': return '#6366f1'; // indigo
            case '~': return '#8b5cf6'; // violeta
            default: return '#6b7280';
        }
    }

    getMinimapViewBox(): string {
        if (this.elementos().length === 0) return '0 0 1200 800';
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const el of this.elementos()) {
            if (el.x < minX) minX = el.x;
            if (el.y < minY) minY = el.y;
            if (el.x + el.width > maxX) maxX = el.x + el.width;
            if (el.y + this.calcularAltura(el) > maxY) maxY = el.y + this.calcularAltura(el);
        }
        const p = 150;
        return `${minX - p} ${minY - p} ${maxX - minX + p * 2} ${maxY - minY + p * 2}`;
    }

    onMinimapMouseDown(event: MouseEvent): void {
        if (event.button !== 0) return;
        event.stopPropagation();
        this.minimapArrastrando = true;
        
        // Centrar de inmediato
        const svg = event.currentTarget as SVGSVGElement | null;
        // Si el click fue en el rect del viewport, currentTarget es el SVG? No, onMinimapMouseDown esta en el SVG
        // Aseguramos que currentTarget es SVG
        if (svg && svg.tagName === 'svg') {
            const pt = svg.createSVGPoint();
            pt.x = event.clientX;
            pt.y = event.clientY;
            const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
            this.viewBoxX = svgPt.x - this.viewBoxW / 2;
            this.viewBoxY = svgPt.y - this.viewBoxH / 2;
        }

        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }
}
