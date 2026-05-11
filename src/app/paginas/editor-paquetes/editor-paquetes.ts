import { Component, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DiagramaService } from '../../compartidos/servicios/diagrama.service';

interface PkgPackage {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
}

interface PkgClass {
    id: string;
    x: number;
    y: number;
    name: string;
}

interface PkgInterface {
    id: string;
    x: number;
    y: number;
    name: string;
}

interface PkgRelation {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'dependency' | 'import' | 'access' | 'merge';
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
    selector: 'app-editor-paquetes',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './editor-paquetes.html',
    styleUrl: './editor-paquetes.css',
    encapsulation: ViewEncapsulation.None
})
export class EditorPaquetesComponent implements AfterViewInit, OnDestroy {

    @ViewChild('svgCanvas') svgCanvas!: ElementRef<SVGSVGElement>;

    diagramaId = 0;
    proyectoId = 0;
    nombreDiagrama = signal('');
    tipoDiagrama = signal('');
    guardando = signal(false);
    guardadoExitoso = signal(false);
    cambiosSinGuardar = signal(false);
    mostrarModalSalir = signal(false);

    packages = signal<PkgPackage[]>([]);
    classes = signal<PkgClass[]>([]);
    interfaces = signal<PkgInterface[]>([]);
    relations = signal<PkgRelation[]>([]);
    notes = signal<Note[]>([]);

    packageSeleccionado = signal<PkgPackage | null>(null);
    classSeleccionada = signal<PkgClass | null>(null);
    interfaceSeleccionada = signal<PkgInterface | null>(null);
    relationSeleccionada = signal<PkgRelation | null>(null);
    noteSeleccionada = signal<Note | null>(null);

    arrastrandoPackage = false;
    arrastrandoClass = false;
    arrastrandoInterface = false;
    arrastrandoNote = false;
    offsetX = 0;
    offsetY = 0;

    modoConexion = signal(false);
    tipoConexionActual = signal('dependency');
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

    contadorPackages = 0;
    contadorClasses = 0;
    contadorInterfaces = 0;

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
                this.packages.set(datos.packages || []);
                this.classes.set(datos.classes || []);
                this.interfaces.set(datos.interfaces || []);
                this.relations.set(datos.relations || []);
                this.notes.set(datos.notes || []);
                this.contadorPackages = this.packages().length;
                this.contadorClasses = this.classes().length;
                this.contadorInterfaces = this.interfaces().length;
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
        this.packageSeleccionado.set(null);
        this.classSeleccionada.set(null);
        this.interfaceSeleccionada.set(null);
        this.relationSeleccionada.set(null);
        this.noteSeleccionada.set(null);
    }

    clientToSVG(event: MouseEvent): { x: number; y: number } {
        const svg = this.svgCanvas.nativeElement;
        const pt = svg.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
        return { x: svgPt.x, y: svgPt.y };
    }

    onCanvasMouseDown(event: MouseEvent): void {
        if (event.button !== 0) return;
        if (this.modoConexion()) { this.cancelarConexion(); return; }
        this.limpiarSeleccion();
        this.panActivo = true;
        this.panStartX = event.clientX;
        this.panStartY = event.clientY;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onPackageMouseDown(event: MouseEvent, pkg: PkgPackage): void {
        event.stopPropagation();
        if (this.modoConexion()) { this.manejarClickConexion(pkg.id); return; }
        this.limpiarSeleccion();
        this.packageSeleccionado.set(pkg);
        this.arrastrandoPackage = true;
        const svgPt = this.clientToSVG(event);
        this.offsetX = svgPt.x - pkg.x;
        this.offsetY = svgPt.y - pkg.y;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onClassMouseDown(event: MouseEvent, cls: PkgClass): void {
        event.stopPropagation();
        if (this.modoConexion()) { this.manejarClickConexion(cls.id); return; }
        this.limpiarSeleccion();
        this.classSeleccionada.set(cls);
        this.arrastrandoClass = true;
        const svgPt = this.clientToSVG(event);
        this.offsetX = svgPt.x - cls.x;
        this.offsetY = svgPt.y - cls.y;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onInterfaceMouseDown(event: MouseEvent, iface: PkgInterface): void {
        event.stopPropagation();
        if (this.modoConexion()) { this.manejarClickConexion(iface.id); return; }
        this.limpiarSeleccion();
        this.interfaceSeleccionada.set(iface);
        this.arrastrandoInterface = true;
        const svgPt = this.clientToSVG(event);
        this.offsetX = svgPt.x - iface.x;
        this.offsetY = svgPt.y - iface.y;
        document.addEventListener('mousemove', this.boundMouseMove);
        document.addEventListener('mouseup', this.boundMouseUp);
    }

    onRelationMouseDown(event: MouseEvent, rel: PkgRelation): void {
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

        if (this.arrastrandoPackage) {
            const p = this.packageSeleccionado();
            if (p) { p.x = svgPt.x - this.offsetX; p.y = svgPt.y - this.offsetY; this.packages.set([...this.packages()]); }
        }
        if (this.arrastrandoClass) {
            const c = this.classSeleccionada();
            if (c) { c.x = svgPt.x - this.offsetX; c.y = svgPt.y - this.offsetY; this.classes.set([...this.classes()]); }
        }
        if (this.arrastrandoInterface) {
            const i = this.interfaceSeleccionada();
            if (i) { i.x = svgPt.x - this.offsetX; i.y = svgPt.y - this.offsetY; this.interfaces.set([...this.interfaces()]); }
        }
        if (this.arrastrandoNote) {
            const n = this.noteSeleccionada();
            if (n) { n.x = svgPt.x - this.offsetX; n.y = svgPt.y - this.offsetY; this.notes.set([...this.notes()]); }
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
        if (this.arrastrandoPackage || this.arrastrandoClass || this.arrastrandoInterface || this.arrastrandoNote) this.marcarCambio();
        this.arrastrandoPackage = false;
        this.arrastrandoClass = false;
        this.arrastrandoInterface = false;
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
        const nz = Number(val);
        if (isNaN(nz) || nz <= 0.1) return;
        const factor = this.zoom / nz;
        const cx = this.viewBoxX + this.viewBoxW / 2;
        const cy = this.viewBoxY + this.viewBoxH / 2;
        this.viewBoxW *= factor;
        this.viewBoxH *= factor;
        this.viewBoxX = cx - this.viewBoxW / 2;
        this.viewBoxY = cy - this.viewBoxH / 2;
        this.zoom = nz;
    }

    zoomIn(): void { this.setZoomStr(this.zoom + 0.1); }
    zoomOut(): void { this.setZoomStr(Math.max(0.2, this.zoom - 0.1)); }
    getZoomPercent(): number { return Math.round(this.zoom * 100); }

    agregarPaquete(): void {
        this.contadorPackages++;
        const nuevo: PkgPackage = {
            id: `pkg_${Date.now()}`,
            x: this.viewBoxX + this.viewBoxW / 2 - 150,
            y: this.viewBoxY + this.viewBoxH / 2 - 100,
            width: 300, height: 200,
            name: `Paquete ${this.contadorPackages}`
        };
        this.packages.set([...this.packages(), nuevo]);
        this.limpiarSeleccion();
        this.packageSeleccionado.set(nuevo);
        this.marcarCambio();
    }

    agregarClase(): void {
        this.contadorClasses++;
        const nueva: PkgClass = {
            id: `cls_${Date.now()}`,
            x: this.viewBoxX + this.viewBoxW / 2 - 60,
            y: this.viewBoxY + this.viewBoxH / 2 - 20,
            name: `Clase ${this.contadorClasses}`
        };
        this.classes.set([...this.classes(), nueva]);
        this.limpiarSeleccion();
        this.classSeleccionada.set(nueva);
        this.marcarCambio();
    }

    agregarInterfaz(): void {
        this.contadorInterfaces++;
        const nueva: PkgInterface = {
            id: `iface_${Date.now()}`,
            x: this.viewBoxX + this.viewBoxW / 2 - 60,
            y: this.viewBoxY + this.viewBoxH / 2 - 20,
            name: `IInterfaz ${this.contadorInterfaces}`
        };
        this.interfaces.set([...this.interfaces(), nueva]);
        this.limpiarSeleccion();
        this.interfaceSeleccionada.set(nueva);
        this.marcarCambio();
    }

    agregarNota(): void {
        const nueva: Note = {
            id: `note_${Date.now()}`,
            x: this.viewBoxX + this.viewBoxW / 2 - 90,
            y: this.viewBoxY + this.viewBoxH / 2 - 50,
            width: 180, height: 100,
            text: 'Escribe aqui tu nota...'
        };
        this.notes.set([...this.notes(), nueva]);
        this.limpiarSeleccion();
        this.noteSeleccionada.set(nueva);
        this.marcarCambio();
    }

    eliminarElemento(): void {
        const p = this.packageSeleccionado();
        if (p) {
            this.packages.set(this.packages().filter(x => x.id !== p.id));
            this.relations.set(this.relations().filter(r => r.sourceId !== p.id && r.targetId !== p.id));
            this.packageSeleccionado.set(null);
            this.marcarCambio(); return;
        }
        const c = this.classSeleccionada();
        if (c) {
            this.classes.set(this.classes().filter(x => x.id !== c.id));
            this.relations.set(this.relations().filter(r => r.sourceId !== c.id && r.targetId !== c.id));
            this.classSeleccionada.set(null);
            this.marcarCambio(); return;
        }
        const i = this.interfaceSeleccionada();
        if (i) {
            this.interfaces.set(this.interfaces().filter(x => x.id !== i.id));
            this.relations.set(this.relations().filter(r => r.sourceId !== i.id && r.targetId !== i.id));
            this.interfaceSeleccionada.set(null);
            this.marcarCambio(); return;
        }
        const r = this.relationSeleccionada();
        if (r) {
            this.relations.set(this.relations().filter(x => x.id !== r.id));
            this.relationSeleccionada.set(null);
            this.marcarCambio(); return;
        }
        const n = this.noteSeleccionada();
        if (n) {
            this.notes.set(this.notes().filter(x => x.id !== n.id));
            this.noteSeleccionada.set(null);
            this.marcarCambio();
        }
    }

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
            const nueva: PkgRelation = {
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
        const pkg = this.packages().find(p => p.id === id);
        if (pkg) return { x: pkg.x + pkg.width / 2, y: pkg.y + pkg.height / 2 };
        const cls = this.classes().find(c => c.id === id);
        if (cls) return { x: cls.x + 60, y: cls.y + 20 };
        const iface = this.interfaces().find(i => i.id === id);
        if (iface) return { x: iface.x + 60, y: iface.y + 20 };
        return { x: 0, y: 0 };
    }

    getRelationLabel(type: string): string {
        switch (type) {
            case 'dependency': return '<<use>>';
            case 'import': return '<<import>>';
            case 'access': return '<<access>>';
            case 'merge': return '<<merge>>';
            default: return '';
        }
    }

    actualizarNombre(nombre: string, tipo: string): void {
        if (tipo === 'package') {
            const sel = this.packageSeleccionado();
            if (sel) { sel.name = nombre; this.packages.set([...this.packages()]); }
        } else if (tipo === 'class') {
            const sel = this.classSeleccionada();
            if (sel) { sel.name = nombre; this.classes.set([...this.classes()]); }
        } else if (tipo === 'interface') {
            const sel = this.interfaceSeleccionada();
            if (sel) { sel.name = nombre; this.interfaces.set([...this.interfaces()]); }
        }
        this.marcarCambio();
    }

    actualizarDimensionPaquete(campo: 'width' | 'height', valor: string): void {
        const sel = this.packageSeleccionado();
        if (!sel) return;
        const num = Number(valor);
        if (isNaN(num) || num < 100) return;
        sel[campo] = num;
        this.packages.set([...this.packages()]);
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

    volver(): void {
        if (this.cambiosSinGuardar()) { this.mostrarModalSalir.set(true); }
        else { this.router.navigate(['/proyectos', this.proyectoId]); }
    }

    salirSinGuardar(): void {
        this.mostrarModalSalir.set(false);
        this.router.navigate(['/proyectos', this.proyectoId]);
    }

    marcarCambio(): void { this.cambiosSinGuardar.set(true); }

    guardarDiagrama(salirAlTerminar = false): void {
        this.guardando.set(true);
        this.guardadoExitoso.set(false);
        const datosG = {
            packages: this.packages(),
            classes: this.classes(),
            interfaces: this.interfaces(),
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
                if (salirAlTerminar) { this.router.navigate(['/proyectos', this.proyectoId]); }
                else { setTimeout(() => this.guardadoExitoso.set(false), 3000); }
            },
            error: () => { this.guardando.set(false); alert('Error al guardar diagrama'); }
        });
    }

    resetView(): void {
        const allX: number[] = [];
        const allY: number[] = [];
        for (const p of this.packages()) { allX.push(p.x, p.x + p.width); allY.push(p.y, p.y + p.height); }
        for (const c of this.classes()) { allX.push(c.x, c.x + 120); allY.push(c.y, c.y + 40); }
        for (const i of this.interfaces()) { allX.push(i.x, i.x + 120); allY.push(i.y, i.y + 40); }
        for (const n of this.notes()) { allX.push(n.x, n.x + n.width); allY.push(n.y, n.y + n.height); }
        if (allX.length === 0) { this.viewBoxX = 0; this.viewBoxY = 0; this.viewBoxW = 1200; this.viewBoxH = 800; this.zoom = 1; return; }
        const pad = 100;
        const minX = Math.min(...allX) - pad, minY = Math.min(...allY) - pad;
        const maxX = Math.max(...allX) + pad, maxY = Math.max(...allY) + pad;
        let w = Math.max(maxX - minX, 1200), h = Math.max(maxY - minY, 800);
        const aspect = 1200 / 800;
        if (w / h > aspect) { h = w / aspect; } else { w = h * aspect; }
        this.viewBoxX = minX - (w - (maxX - minX)) / 2;
        this.viewBoxY = minY - (h - (maxY - minY)) / 2;
        this.viewBoxW = w; this.viewBoxH = h;
        this.zoom = 1200 / w;
    }

    onMinimapMouseDown(event: MouseEvent): void {
        this.minimapArrastrando = true;
        this.onMouseMove(event);
    }
}
