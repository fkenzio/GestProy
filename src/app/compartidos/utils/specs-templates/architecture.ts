import { SpecsData } from '../../servicios/specs.service';

export function generarArchitecture(data: SpecsData): string {
    const diagPaq = data.diagramas.find((d: any) => d.tipo === 'paquetes');
    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');
    const diagCU = data.diagramas.find((d: any) => d.tipo === 'casos_uso');
    const useCases: any[] = diagCU?.datos?.useCases || [];

    const elementos: any[] = diagClases?.datos?.elementos || [];
    const conexiones: any[] = diagClases?.datos?.conexiones || [];
    const clases = elementos.filter((e: any) => e.type === 'clase');

    // Nombre de BD
    const dbName = data.proyecto.nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_db';

    // Detectar auth
    const hasAuth = useCases.some((uc: any) => {
        const n = uc.name?.toLowerCase() || '';
        return n.includes('login') || n.includes('registro') || n.includes('autenticacion') || n.includes('iniciar sesion');
    }) || clases.some((c: any) => {
        const n = c.data?.name?.toLowerCase() || '';
        return n.includes('usuario') || n.includes('user');
    });

    let modulesSection = '';

    if (diagPaq?.datos) {
        const pkgs: any[] = diagPaq.datos.packages || [];
        const cls: any[] = diagPaq.datos.classes || [];
        const ifaces: any[] = diagPaq.datos.interfaces || [];
        const rels: any[] = diagPaq.datos.relations || [];

        if (pkgs.length > 0) {
            modulesSection += `## BLUEPRINTS Y MODULOS DERIVADOS DEL DIAGRAMA DE PAQUETES\n\n`;
            for (const pkg of pkgs) {
                const moduleName = pkg.name.toLowerCase().replace(/\s+/g, '-');
                const moduleNameSnake = moduleName.replace(/-/g, '_');
                modulesSection += `### ${pkg.name}\n\n`;
                modulesSection += `- Backend (Flask Blueprint): \`backend/app/blueprints/${moduleNameSnake}/\`\n`;
                modulesSection += `- Frontend (Angular Component): \`frontend/src/app/pages/${moduleName}/\`\n`;
                modulesSection += `- Ruta Base API: \`/api/${moduleName}\`\n\n`;
            }
            if (cls.length > 0) {
                modulesSection += `### Clases en paquetes\n\n`;
                for (const c of cls) modulesSection += `- ${c.name}\n`;
                modulesSection += `\n`;
            }
            if (ifaces.length > 0) {
                modulesSection += `### Interfaces\n\n`;
                for (const i of ifaces) modulesSection += `- ${i.name}\n`;
                modulesSection += `\n`;
            }
        }
    }

    if (!modulesSection && clases.length > 0) {
        modulesSection += `## BLUEPRINTS DEDUCIDOS DEL DIAGRAMA DE CLASES\n\n`;
        modulesSection += `No se encontro diagrama de paquetes. Blueprints deducidos de las entidades:\n\n`;
        for (const cls of clases) {
            const name = cls.data?.name || 'Entidad';
            const moduleName = name.toLowerCase().replace(/\s+/g, '-');
            const moduleNameSnake = moduleName.replace(/-/g, '_');
            modulesSection += `### ${name}\n\n`;
            modulesSection += `- Backend Blueprint: \`backend/app/blueprints/${moduleNameSnake}/\`\n`;
            modulesSection += `- Frontend Component: \`frontend/src/app/pages/${moduleName}/\`\n`;
            modulesSection += `- Ruta Base API: \`/api/${moduleName}\`\n`;
            modulesSection += `- Endpoints: GET /api/${moduleName}, GET /api/${moduleName}/<id>, POST /api/${moduleName}, PATCH /api/${moduleName}/<id>, DELETE /api/${moduleName}/<id>\n\n`;
        }
    }

    if (!modulesSection) {
        modulesSection = `## MODULOS\n\nNo se encontraron diagramas. Definir modulos manualmente.\n\n`;
    }

    // Endpoints list y contratos JSON
    let endpointsSection = `## ENDPOINTS REST Y CONTRATOS JSON\n\n`;
    endpointsSection += `> Todo endpoint DEBE retornar siempre JSON. Los errores deben ser \`{"error": "Mensaje"}\`.\n\n`;
    
    if (hasAuth) {
        endpointsSection += `### Autenticacion\n\n`;
        endpointsSection += `| Metodo | Ruta | Descripcion | Auth Required | Contrato JSON Retorno |\n| --- | --- | --- | --- | --- |\n`;
        endpointsSection += `| POST | /api/auth/register | Registrar usuario | No | \`{"message": "Creado", "id": 1}\` |\n`;
        endpointsSection += `| POST | /api/auth/login | Login → devuelve JWT | No | \`{"access_token": "ey..."}\` |\n`;
        endpointsSection += `| GET | /api/auth/me | Perfil del usuario | Si | \`{"id": 1, "email": "a@a.com", "rol": "USER"}\` |\n\n`;
    }

    for (const cls of clases) {
        const name = cls.data?.name || 'Entidad';
        const route = name.toLowerCase().replace(/\s+/g, '-');
        
        // Simular atributos para el JSON
        const attrs = cls.data?.attributes || [];
        const jsonMock: any = { id: 1 };
        attrs.slice(0, 3).forEach((a: any) => {
            const type = a.type?.toLowerCase() || 'string';
            if (type.includes('int') || type.includes('number')) jsonMock[a.name] = 0;
            else if (type.includes('bool')) jsonMock[a.name] = true;
            else jsonMock[a.name] = "string";
        });
        const jsonStr = JSON.stringify(jsonMock).replace(/"/g, "'");

        endpointsSection += `### ${name}\n\n`;
        endpointsSection += `| Metodo | Ruta | Descripcion | Auth | Contrato JSON Retorno |\n| --- | --- | --- | --- | --- |\n`;
        endpointsSection += `| GET | /api/${route} | Listar todos | ${hasAuth ? 'Si' : 'No'} | \`[${jsonStr}]\` |\n`;
        endpointsSection += `| GET | /api/${route}/<id> | Obtener por ID | ${hasAuth ? 'Si' : 'No'} | \`${jsonStr}\` |\n`;
        endpointsSection += `| POST | /api/${route} | Crear nuevo | ${hasAuth ? 'Si' : 'No'} | \`${jsonStr}\` |\n`;
        endpointsSection += `| PATCH | /api/${route}/<id> | Actualizar | ${hasAuth ? 'Si' : 'No'} | \`${jsonStr}\` |\n`;
        endpointsSection += `| DELETE | /api/${route}/<id> | Eliminar | ${hasAuth ? 'Si' : 'No'} | \`{"message": "Eliminado"}\` |\n\n`;
    }

    // Extra endpoints from use cases
    const businessUC = useCases.filter((uc: any) => {
        const n = uc.name?.toLowerCase() || '';
        return !n.includes('ver') && !n.includes('listar') && !n.includes('consultar')
            && !n.includes('login') && !n.includes('registro') && !n.includes('buscar');
    });
    if (businessUC.length > 0) {
        endpointsSection += `### Acciones de Negocio Adicionales\n\n`;
        endpointsSection += `| Metodo | Ruta sugerida | Caso de Uso | Auth Required | Contrato JSON |\n| --- | --- | --- | --- | --- |\n`;
        for (const uc of businessUC) {
            const route = uc.name.toLowerCase().replace(/\s+/g, '-');
            endpointsSection += `| POST | /api/acciones/${route} | ${uc.name} | ${hasAuth ? 'Si' : 'No'} | \`{"success": true, "message": "Completado"}\` |\n`;
        }
        endpointsSection += `\n`;
    }

    return `# 04_SYSTEM_ARCHITECTURE

## OBJETIVO

Arquitectura base del sistema **${data.proyecto.nombre}**. Aplicacion fullstack separada:

- Backend: Flask (Python)
- Frontend: Angular 17+ (Standalone Components)

---

## BASE DE DATOS

| Campo | Valor |
| --- | --- |
| Motor | MySQL |
| Nombre de BD | \`${dbName}\` |
| ORM | SQLAlchemy |
| Variable de entorno | \`MYSQL_URI\` (en archivo .env) |
| Tablas | ${clases.map((c: any) => `\`${c.data?.name?.toLowerCase().replace(/\s+/g, '_')}\``).join(', ') || 'No definidas'} |

\`MYSQL_URI\` format example (generar un .env.example con esto):
\`\`\`
MYSQL_URI=mysql+pymysql://root:password@localhost:3306/${dbName}
\`\`\`

---

## PRINCIPIOS ARQUITECTONICOS

- Separacion clara entre frontend y backend
- Backend responsable de logica de negocio, validacion y base de datos
- Frontend responsable de presentacion, interaccion y consumo de API HTTP
- SQLAlchemy es la unica capa de acceso a base de datos (Flask-SQLAlchemy)
- Todo endpoint de Flask devuelve JSON estructurado
- Frontend Angular usa RxJS (Observables) o Signals para el estado
- No escribir consultas SQL puras (usar ORM)
- Flask organizado en Blueprints (NO meter todas las rutas en app.py)

---

${modulesSection}

---

${endpointsSection}

---

## ESTRUCTURA DE CARPETAS SUGERIDA

\`\`\`txt
/
├── backend/
│   ├── .env.example
│   ├── requirements.txt
│   ├── run.py                 ← Punto de entrada de Flask
│   └── app/
│       ├── __init__.py        ← Inicializa app y registra Blueprints
│       ├── config.py
│       ├── extensions.py      ← db = SQLAlchemy()
│       ├── models.py          ← Copiar de 03_DATA_MODEL.md
${hasAuth ? '│       ├── auth/\n│       │   ├── __init__.py\n│       │   ├── routes.py      ← auth_bp\n│       │   └── utils.py       ← jwt helper\n' : ''}│       └── blueprints/
│           └── <module>/
│               ├── __init__.py
│               ├── routes.py  ← blueprint
│               └── schemas.py ← para validacion y serializacion (Marshmallow o manual)
└── frontend/
    ├── angular.json
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── index.html
        ├── styles.css
        ├── environments/
        │   └── environment.ts ← URL base API: 'http://localhost:5000/api'
        └── app/
            ├── app.config.ts  ← proveer HttpClient
            ├── app.component.ts
            ├── app.routes.ts
            ├── core/
            │   └── services/  ← Servicios centralizados (api.service.ts)
            ├── shared/
            │   └── components/
            └── pages/
                └── <feature>/
                    └── <feature>.component.ts
\`\`\`

---

## CONFIGURACION BACKEND (CORS)

Asegurarse de instalar \`flask-cors\` y configurarlo en \`app/__init__.py\` para permitir solicitudes desde el frontend Angular (típicamente http://localhost:4200).

---

## CONFIGURACION FRONTEND

Centralizar en \`src/app/core/services/api.service.ts\`:
\`\`\`typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private url = environment.apiUrl;

  get<T>(path: string) { return this.http.get<T>(\`\${this.url}\${path}\`); }
  post<T>(path: string, body: any) { return this.http.post<T>(\`\${this.url}\${path}\`, body); }
  put<T>(path: string, body: any) { return this.http.put<T>(\`\${this.url}\${path}\`, body); }
  delete<T>(path: string) { return this.http.delete<T>(\`\${this.url}\${path}\`); }
}
\`\`\`
`;
}
