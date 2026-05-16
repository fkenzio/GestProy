import { SpecsData } from '../../servicios/specs.service';

export function generarAgentInstructions(_data: SpecsData): string {
    return `# 01_AI_CONTEXT

## ROL Y OBJETIVO

Eres un agente implementador senior. Tu tarea es construir desde cero una aplicacion web completa a partir de estos archivos de especificacion, respetando estrictamente los requisitos, el modelo de datos, la arquitectura, los flujos y las reglas visuales.

No debes preguntar, pedir confirmacion ni proponer alternativas. Si algo no esta explicitamente definido, aplica la convencion mas estandar del stack definido aqui.

Tu resultado debe ser una aplicacion funcional, compilable, visualmente cuidada y coherente con los archivos de especificacion.

---

## STACK TECNOLOGICO

### Frontend
- Framework: **Next.js 15+** con App Router
- UI: **React 19+**
- Lenguaje: **TypeScript 5+**
- Estilos: **TailwindCSS**
- Iconos: **lucide-react**

### Backend
- Framework: **NestJS 11+**
- Lenguaje: **TypeScript 5+**
- ORM: **Prisma**
- Base de datos: definida en 04_SYSTEM_ARCHITECTURE.md (default: PostgreSQL)
- Validacion: class-validator + class-transformer

---

## ORDEN OBLIGATORIO DE LECTURA

1. 01_AI_CONTEXT.md
2. 02_SYSTEM_REQUIREMENTS.md — casos de uso, actores y reglas funcionales
3. 03_DATA_MODEL.md — entidades, atributos, metodos y relaciones
4. 04_SYSTEM_ARCHITECTURE.md — estructura del proyecto y convenciones tecnicas
5. 05_WORKFLOWS.md — flujos de proceso y secuencias
6. 06_IMPLEMENTATION_PHASES.md — fases obligatorias de construccion
7. 07_UI_UX_GUIDELINES.md — reglas visuales y UX/UI

No implementes nada antes de haber considerado todos los archivos.

---

## PRINCIPIO DE IMPLEMENTACION

1. Primero entender entidades, relaciones y reglas.
2. Despues crear base de datos y API.
3. Despues crear servicios frontend y pantallas.
4. Al final pulir UX/UI y responsive.

---

## REGLAS DE INFERENCIA

### Puedes inferir
- Nombres de rutas REST a partir de casos de uso
- Nombres de modulos a partir de entidades
- Pantallas necesarias a partir de casos de uso
- Validaciones basicas segun tipos de datos
- Relaciones Prisma segun multiplicidades UML

### No puedes inventar
- Entidades no descritas
- Campos no descritos
- Relaciones no descritas
- Endpoints no respaldados por casos de uso
- Pantallas sin proposito funcional
- Dashboards si no hay metricas definidas
- Autenticacion si no esta pedida

---

## REGLAS DE BACKEND

- Un modulo NestJS por entidad principal
- Cada modulo: module, controller, service, DTOs
- Controllers solo manejan HTTP
- Logica de negocio en services
- Prisma solo desde services
- No SQL directo
- Usar class-validator en DTOs
- Manejar errores con excepciones NestJS

---

## REGLAS DE FRONTEND

- Usar Next.js App Router
- Componentes funcionales React con TypeScript
- Centralizar llamadas HTTP en lib/api.ts
- Cada pantalla: loading, error, empty, success states
- Formularios con validacion minima
- UI responsive con TailwindCSS

---

## CHECKLIST FINAL

- [ ] Backend compila sin errores TypeScript
- [ ] Frontend compila sin errores TypeScript
- [ ] schema.prisma contiene todas las entidades de 03_DATA_MODEL.md
- [ ] Todas las relaciones del modelo estan representadas
- [ ] Todos los casos de uso de 02_SYSTEM_REQUIREMENTS.md tienen endpoint o flujo
- [ ] Pantallas principales existen y son navegables
- [ ] Formularios tienen validacion minima
- [ ] UI aplica TailwindCSS correctamente
- [ ] UI es responsive
- [ ] No hay rutas API hardcodeadas dispersas
`;
}
