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
- Framework: **Angular 17+**
- Componentes: **Standalone Components** (obligatorio, no usar NgModules)
- Lenguaje: **TypeScript 5+**
- Estilos: **TailwindCSS**
- Iconos: **Lucide Angular** (lucide-angular) o Material Icons

### Backend
- Framework: **Flask (Python 3.10+)**
- Arquitectura: **Blueprints** (cada entidad debe tener su blueprint en una carpeta separada)
- ORM: **SQLAlchemy** (Flask-SQLAlchemy)
- Base de datos: **MySQL** (usando PyMySQL)
- Migraciones: Flask-Migrate (Alembic)
- Variables de entorno: python-dotenv (.env)

---

## ORDEN OBLIGATORIO DE LECTURA

1. 01_AI_CONTEXT.md
2. 02_SYSTEM_REQUIREMENTS.md — casos de uso, actores y reglas funcionales
3. 03_DATA_MODEL.md — entidades, atributos y modelos SQLAlchemy
4. 04_SYSTEM_ARCHITECTURE.md — estructura del proyecto y contratos API JSON
5. 05_WORKFLOWS.md — flujos de proceso y secuencias
6. 06_IMPLEMENTATION_PHASES.md — fases obligatorias de construccion
7. 07_UI_UX_GUIDELINES.md — reglas visuales y UX/UI

No implementes nada antes de haber considerado todos los archivos.

---

## PRINCIPIO DE IMPLEMENTACION

1. Primero entender entidades, relaciones y reglas.
2. Despues crear base de datos (Flask Models) y API (Flask Blueprints).
3. Despues crear servicios frontend (Angular HttpClient) y pantallas (Angular Components).
4. Al final pulir UX/UI y responsive con Tailwind.

---

## REGLAS DE INFERENCIA

### Puedes inferir
- Nombres de rutas REST a partir de casos de uso
- Nombres de blueprints a partir de entidades
- Pantallas necesarias a partir de casos de uso
- Validaciones basicas segun tipos de datos
- Relaciones SQLAlchemy segun multiplicidades UML

### No puedes inventar
- Entidades no descritas
- Campos no descritos
- Relaciones no descritas
- Endpoints no respaldados por casos de uso
- Pantallas sin proposito funcional
- Autenticacion si no esta pedida explicitamente

---

## REGLAS DE BACKEND (FLASK)

- Usar **Blueprints**. No meter toda la logica en \`app.py\`.
- Cada modulo/entidad debe tener su propia carpeta con \`routes.py\` (controladores).
- Los modelos de base de datos deben estar centralizados o en sus respectivos modulos (SQLAlchemy).
- Retornar siempre respuestas en formato JSON.
- Las variables de entorno (como MYSQL_URI) deben leerse del \`.env\`. Proveer un \`.env.example\`.
- Manejar CORS usando \`Flask-CORS\`.

---

## REGLAS DE FRONTEND (ANGULAR)

- Usar **Standalone Components** exclusivamente.
- Centralizar las llamadas a la API en \`@Injectable()\` Services usando \`HttpClient\`.
- Usar \`Signals\` para manejo de estado reactivo cuando sea posible.
- Cada pantalla debe manejar estados de: loading, error, empty, success.
- Formularios Reactivos (\`ReactiveFormsModule\`) con validacion basica.
- UI responsive con TailwindCSS.

---

## CHECKLIST FINAL

- [ ] Backend arranca sin errores de importacion en Flask.
- [ ] Frontend compila sin errores TypeScript (ng build).
- [ ] SQLAlchemy models creados correctamente.
- [ ] Todos los casos de uso de 02_SYSTEM_REQUIREMENTS.md tienen endpoint (Blueprint) o flujo.
- [ ] Pantallas principales existen, estan ruteadas y son navegables.
- [ ] Las peticiones HTTP del Angular Service apuntan a la URL base correcta de Flask.
- [ ] UI aplica TailwindCSS correctamente.
- [ ] No hay rutas API hardcodeadas dispersas en componentes, todas usan los Services.
`;
}
