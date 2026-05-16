import { SpecsData } from '../../servicios/specs.service';

export function generarArchitecture(data: SpecsData): string {
    const diagPaq = data.diagramas.find((d: any) => d.tipo === 'paquetes');
    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');
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
                modulesSection += `### ${pkg.name}\n\nModulo backend: \`src/${moduleName}/\`\nFeature frontend: \`src/features/${moduleName}/\`\nRuta: \`/${moduleName}\`\n\n`;
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

    if (!modulesSection && diagClases?.datos) {
        const elementos: any[] = diagClases.datos.elementos || [];
        const clases = elementos.filter((e: any) => e.type === 'clase');
        if (clases.length > 0) {
            modulesSection += `## MODULOS DEDUCIDOS DEL DIAGRAMA DE CLASES\n\nNo se encontro diagrama de paquetes. Se deducen los siguientes modulos a partir de las entidades:\n\n`;
            for (const cls of clases) {
                const name = cls.data?.name || 'Entidad';
                const moduleName = name.toLowerCase().replace(/\s+/g, '-');
                modulesSection += `### ${name}\n\n`;
                modulesSection += `- Backend: \`src/${moduleName}/${moduleName}.module.ts\`\n`;
                modulesSection += `- Frontend: \`src/features/${moduleName}/\`\n`;
                modulesSection += `- Ruta: \`/${moduleName}\`\n\n`;
            }
        }
    }

    if (!modulesSection) {
        modulesSection = `## MODULOS\n\nNo se encontraron diagramas de paquetes ni de clases. Definir modulos manualmente.\n\n`;
    }

    return `# 04_SYSTEM_ARCHITECTURE

## OBJETIVO

Arquitectura base del sistema **${data.proyecto.nombre}**. Aplicacion fullstack separada:

- Backend: NestJS + Prisma
- Frontend: Next.js + React + TailwindCSS

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

## ESTRUCTURA GENERAL

\`\`\`txt
/
├── backend/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── prisma/
│       │   ├── prisma.module.ts
│       │   └── prisma.service.ts
│       ├── common/
│       │   ├── dto/
│       │   ├── filters/
│       │   └── utils/
│       └── <module>/
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
        │   └── <feature>/
        │       └── page.tsx
        ├── components/
        │   ├── ui/
        │   └── layout/
        ├── features/
        │   └── <feature>/
        │       ├── components/
        │       ├── services/
        │       └── types.ts
        ├── lib/
        │   ├── api.ts
        │   └── utils.ts
        └── types/
\`\`\`

---

## CONVENCIONES REST

\`\`\`txt
GET    /<resource>         → Listar
GET    /<resource>/:id     → Obtener detalle
POST   /<resource>         → Crear
PATCH  /<resource>/:id     → Actualizar
DELETE /<resource>/:id     → Eliminar
POST   /<resource>/:id/<action> → Accion de negocio
\`\`\`

---

## CONFIGURACION BACKEND

main.ts debe incluir:
- ValidationPipe global con whitelist y transform
- CORS habilitado
- Prefijo global /api

---

## FRONTEND

- Usar App Router de Next.js
- Centralizar API base en src/lib/api.ts
- Variable de entorno: NEXT_PUBLIC_API_URL
- No repetir URLs hardcodeadas en componentes
`;
}
