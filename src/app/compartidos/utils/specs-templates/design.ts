import { SpecsData } from '../../servicios/specs.service';

export function generarDesign(_data: SpecsData): string {
    return `# 07_UI_UX_GUIDELINES

## OBJETIVO VISUAL

La interfaz debe verse como una aplicacion moderna, limpia y premium inspirada en:
- Vercel, Figma, Linear, Raycast, Stripe Dashboard

No debe parecer: Bootstrap, sistema escolar antiguo, panel administrativo generico.

---

# PRINCIPIOS DE DISENO

## 1. Claridad antes que decoracion
Cada pantalla debe comunicar: donde esta el usuario, que puede hacer, cual es la accion principal.

## 2. Whitespace generoso
Preferir: p-6, p-8, gap-6, space-y-6, max-w-7xl mx-auto.
Evitar: elementos pegados, formularios compactados.

## 3. Jerarquia visual fuerte
Cada pantalla: titulo claro, descripcion, accion principal visible, contenido en secciones.

---

# STACK VISUAL

Usar: Angular 17+, TailwindCSS, lucide-angular.
No usar: Bootstrap, CSS inline, librerias UI pesadas que no se soliciten.

---

# PALETA VISUAL

- Fondo general: bg-zinc-50 o bg-white
- Texto principal: text-zinc-950
- Texto secundario: text-zinc-500
- Bordes: border-zinc-200
- Accion principal: bg-zinc-950 text-white
- Error: text-red-600, bg-red-50
- Success: text-emerald-700, bg-emerald-50
- Warning: text-amber-700, bg-amber-50

---

# TIPOGRAFIA

Usar Inter o fuente default del navegador.
- Titulos: text-2xl font-semibold tracking-tight
- Texto: text-sm text-zinc-600
- Metadata: text-xs text-zinc-500

---

# LAYOUT

Desktop: Topbar + Sidebar + Main content (max-w-7xl mx-auto).
Mobile: Navegacion colapsada, contenido en una columna, padding px-4.

---

# COMPONENTES BASE

## Button
Primary: bg-zinc-950 text-white rounded-xl h-10 px-4
Secondary: border border-zinc-200 bg-white rounded-xl

## Card
rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm

## Input
h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm

## Empty State
Toda pantalla sin datos: border-dashed, icono centrado, titulo, descripcion y boton de accion.

---

# LISTADOS

Preferir cards y listas sobre tablas. Usar tabla solo con datos tabulares reales.
Maximo 6 columnas visibles. En mobile convertir a cards.

---

# FORMULARIOS

- Maximo 2 columnas en desktop, 1 en mobile
- Labels claros, errores visibles
- Acciones al final, boton principal a la derecha

---

# RESPONSIVE

- sm:, md:, lg: correctamente usados
- Grids colapsan a una columna
- No overflow horizontal
- Botones importantes accesibles en mobile

---

# MICROINTERACCIONES

Usar: transition, duration-150, hover:bg-zinc-50, active:scale-[0.99].
Evitar: animaciones exageradas, gradientes animados.
`;
}
