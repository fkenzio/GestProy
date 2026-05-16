import { SpecsData } from '../../servicios/specs.service';

export function generarExecution(_data: SpecsData): string {
    return `# 06_IMPLEMENTATION_PHASES

## OBJETIVO

Orden obligatorio de construccion del proyecto. Completar cada fase antes de avanzar.

No esta permitido:
- Saltarse fases
- Acumular errores
- Implementar frontend antes de tener API minima funcional
- Crear pantallas sin endpoints o datos claros

---

# FASE 0 — LECTURA Y PLAN INTERNO

1. Leer todos los archivos de especificacion
2. Identificar: entidades, relaciones, actores, casos de uso, modulos backend, features frontend, endpoints y pantallas necesarias

Criterio de salida: Existe un entendimiento claro de que se debe construir.

---

# FASE 1 — BACKEND BASE + BASE DE DATOS

1. Crear proyecto NestJS en /backend
2. Instalar dependencias: prisma, class-validator, class-transformer
3. Crear schema.prisma completo usando 03_DATA_MODEL.md
4. Ejecutar migracion inicial
5. Crear PrismaModule y PrismaService

Criterio de salida: Migracion ejecuta sin errores. Backend compila.

---

# FASE 2 — BACKEND API Y LOGICA

1. Crear modulos NestJS segun 04_SYSTEM_ARCHITECTURE.md
2. Implementar CRUD basico por entidad
3. Implementar acciones de negocio derivadas de casos de uso y procesos
4. Crear endpoints REST con DTOs y validaciones
5. Configurar main.ts: ValidationPipe, CORS, prefix /api

Criterio de salida: Backend levanta. Endpoints principales responden.

---

# FASE 3 — FRONTEND BASE

1. Crear proyecto Next.js en /frontend con TailwindCSS
2. Instalar lucide-react, clsx
3. Configurar .env.local con NEXT_PUBLIC_API_URL
4. Crear estructura base: app/, components/, features/, lib/, types/
5. Crear componentes UI base y layout principal

Criterio de salida: Next.js corre con npm run dev. TailwindCSS funciona.

---

# FASE 4 — FRONTEND FEATURES Y RUTAS

1. Crear una feature por entidad/caso de uso principal
2. Crear rutas en src/app
3. Implementar listados, formularios, detalle y acciones
4. Conectar pantallas con backend
5. Manejar estados: loading, error, empty, success

Criterio de salida: Pantallas consumen API real. Casos de uso principales completables.

---

# FASE 5 — UX/UI Y RESPONSIVE

1. Aplicar 07_UI_UX_GUIDELINES.md
2. Revisar jerarquia visual, spacing, responsive
3. Asegurar que movil no tenga overflow horizontal
4. Anadir microinteracciones discretas

Criterio de salida: La app se ve moderna y funciona en movil y desktop.

---

# FASE 6 — VERIFICACION FINAL

Ejecutar npm run build en backend y frontend.

Verificar:
- No hay errores TypeScript
- No hay imports rotos
- Formularios funcionan
- Listados cargan datos
- UI tiene estados vacios y errores
`;
}
