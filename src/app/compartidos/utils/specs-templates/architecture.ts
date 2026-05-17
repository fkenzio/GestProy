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
            modulesSection += `## MODULOS DERIVADOS DEL DIAGRAMA DE PAQUETES\n\n`;
            for (const pkg of pkgs) {
                const moduleName = pkg.name.toLowerCase().replace(/\s+/g, '-');
                modulesSection += `### ${pkg.name}\n\n`;
                modulesSection += `- Backend: \`src/${moduleName}/${moduleName}.module.ts\`\n`;
                modulesSection += `- Frontend: \`src/features/${moduleName}/\`\n`;
                modulesSection += `- Ruta: \`/${moduleName}\`\n\n`;
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
            if (rels.length > 0) {
                modulesSection += `### Dependencias entre paquetes\n\n| Origen | Destino | Tipo |\n| --- | --- | --- |\n`;
                const allEls = [...pkgs, ...cls, ...ifaces];
                for (const r of rels) {
                    const src = allEls.find((e: any) => e.id === r.sourceId)?.name || '?';
                    const tgt = allEls.find((e: any) => e.id === r.targetId)?.name || '?';
                    modulesSection += `| ${src} | ${tgt} | <<${r.type}>> |\n`;
                }
                modulesSection += `\n`;
            }
        }
    }

    if (!modulesSection && clases.length > 0) {
        modulesSection += `## MODULOS DEDUCIDOS DEL DIAGRAMA DE CLASES\n\n`;
        modulesSection += `No se encontro diagrama de paquetes. Modulos deducidos de las entidades:\n\n`;
        for (const cls of clases) {
            const name = cls.data?.name || 'Entidad';
            const moduleName = name.toLowerCase().replace(/\s+/g, '-');
            modulesSection += `### ${name}\n\n`;
            modulesSection += `- Backend: \`src/${moduleName}/${moduleName}.module.ts\`\n`;
            modulesSection += `- Frontend: \`src/features/${moduleName}/\`\n`;
            modulesSection += `- Ruta: \`/${moduleName}\`\n`;
            modulesSection += `- Endpoints: GET /${moduleName}, GET /${moduleName}/:id, POST /${moduleName}, PATCH /${moduleName}/:id, DELETE /${moduleName}/:id\n\n`;
        }
    }

    if (!modulesSection) {
        modulesSection = `## MODULOS\n\nNo se encontraron diagramas. Definir modulos manualmente.\n\n`;
    }

    // Endpoints list
    let endpointsSection = `## ENDPOINTS REST\n\n`;
    if (hasAuth) {
        endpointsSection += `### Autenticacion\n\n`;
        endpointsSection += `| Metodo | Ruta | Descripcion | Auth Required |\n| --- | --- | --- | --- |\n`;
        endpointsSection += `| POST | /auth/register | Registrar usuario | No |\n`;
        endpointsSection += `| POST | /auth/login | Login → devuelve JWT | No |\n`;
        endpointsSection += `| GET | /auth/me | Perfil del usuario autenticado | Si |\n\n`;
    }

    for (const cls of clases) {
        const name = cls.data?.name || 'Entidad';
        const route = name.toLowerCase().replace(/\s+/g, '-');
        endpointsSection += `### ${name}\n\n`;
        endpointsSection += `| Metodo | Ruta | Descripcion | Auth Required |\n| --- | --- | --- | --- |\n`;
        endpointsSection += `| GET | /${route} | Listar todos | ${hasAuth ? 'Si' : 'No'} |\n`;
        endpointsSection += `| GET | /${route}/:id | Obtener por ID | ${hasAuth ? 'Si' : 'No'} |\n`;
        endpointsSection += `| POST | /${route} | Crear nuevo | ${hasAuth ? 'Si' : 'No'} |\n`;
        endpointsSection += `| PATCH | /${route}/:id | Actualizar | ${hasAuth ? 'Si' : 'No'} |\n`;
        endpointsSection += `| DELETE | /${route}/:id | Eliminar | ${hasAuth ? 'Si' : 'No'} |\n\n`;
    }

    // Extra endpoints from use cases
    const businessUC = useCases.filter((uc: any) => {
        const n = uc.name?.toLowerCase() || '';
        return !n.includes('ver') && !n.includes('listar') && !n.includes('consultar')
            && !n.includes('login') && !n.includes('registro') && !n.includes('buscar');
    });
    if (businessUC.length > 0) {
        endpointsSection += `### Acciones de Negocio Adicionales\n\n`;
        endpointsSection += `| Metodo | Ruta sugerida | Caso de Uso | Auth Required |\n| --- | --- | --- | --- |\n`;
        for (const uc of businessUC) {
            const route = uc.name.toLowerCase().replace(/\s+/g, '-');
            endpointsSection += `| POST | /acciones/${route} | ${uc.name} | ${hasAuth ? 'Si' : 'No'} |\n`;
        }
        endpointsSection += `\n`;
    }

    return `# 04_SYSTEM_ARCHITECTURE

## OBJETIVO

Arquitectura base del sistema **${data.proyecto.nombre}**. Aplicacion fullstack separada:

- Backend: NestJS + Prisma
- Frontend: Next.js + React + TailwindCSS

---

## BASE DE DATOS

| Campo | Valor |
| --- | --- |
| Motor | PostgreSQL |
| Nombre de BD | \`${dbName}\` |
| ORM | Prisma |
| Variable de entorno | \`DATABASE_URL\` |
| Tablas | ${clases.map((c: any) => `\`${c.data?.name?.toLowerCase().replace(/\s+/g, '_')}\``).join(', ') || 'No definidas'} |

\`DATABASE_URL\` format:
\`\`\`
postgresql://USER:PASSWORD@localhost:5432/${dbName}?schema=public
\`\`\`

---

## PRINCIPIOS ARQUITECTONICOS

- Separacion clara entre frontend y backend
- Backend responsable de logica de negocio, validacion y persistencia
- Frontend responsable de presentacion, interaccion y consumo de API
- Prisma es la unica capa de acceso a base de datos
- No escribir SQL directo
- No duplicar logica de negocio en frontend
- No crear modulos sin respaldo en requisitos, entidades o procesos

---

${modulesSection}

---

${endpointsSection}

---

## ESTRUCTURA DE CARPETAS

\`\`\`txt
/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       ← Copiar de 03_DATA_MODEL.md
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── prisma/
│       │   ├── prisma.module.ts
│       │   └── prisma.service.ts
${hasAuth ? '│       ├── auth/\n│       │   ├── auth.module.ts\n│       │   ├── auth.controller.ts\n│       │   ├── auth.service.ts\n│       │   ├── jwt.strategy.ts\n│       │   └── dto/\n' : ''}│       └── <module>/
│           ├── <module>.module.ts
│           ├── <module>.controller.ts
│           ├── <module>.service.ts
│           └── dto/
│               ├── create-<module>.dto.ts
│               └── update-<module>.dto.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── page.tsx
${hasAuth ? '│   │   ├── login/\n│   │   │   └── page.tsx\n│   │   ├── register/\n│   │   │   └── page.tsx\n' : ''}│       └── <feature>/
        │           └── page.tsx
        ├── components/
        │   ├── ui/
        │   └── layout/
        ├── lib/
        │   ├── api.ts           ← URL base centralizada
        │   └── utils.ts
        └── types/
\`\`\`

---

## CONFIGURACION BACKEND (main.ts)

\`\`\`typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.enableCors();
app.setGlobalPrefix('api');
\`\`\`

---

## CONFIGURACION FRONTEND

Crear \`.env.local\` en /frontend:
\`\`\`
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

Centralizar en \`src/lib/api.ts\`:
\`\`\`typescript
const API = process.env.NEXT_PUBLIC_API_URL!;
export const get = (path: string) => fetch(\`\${API}\${path}\`).then(r => r.json());
export const post = (path: string, body: any) => fetch(\`\${API}\${path}\`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) }).then(r => r.json());
\`\`\`
`;
}
