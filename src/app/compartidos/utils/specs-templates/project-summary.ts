import { SpecsData } from '../../servicios/specs.service';

export function generarProjectSummary(data: SpecsData): string {
    const diagCU = data.diagramas.find((d: any) => d.tipo === 'casos_uso');
    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');
    const diagsSeq = data.diagramas.filter((d: any) => d.tipo === 'secuencia');
    const diagPaq = data.diagramas.find((d: any) => d.tipo === 'paquetes');

    const useCases: any[] = diagCU?.datos?.useCases || [];
    const actors: any[] = diagCU?.datos?.actors || [];
    const elementos: any[] = diagClases?.datos?.elementos || [];
    const conexiones: any[] = diagClases?.datos?.conexiones || [];
    const clases = elementos.filter((e: any) => e.type === 'clase');
    const enums = elementos.filter((e: any) => e.type === 'enum');

    // Detectar patrones de auth
    const hasAuth = useCases.some((uc: any) => {
        const n = uc.name?.toLowerCase() || '';
        return n.includes('login') || n.includes('registro') || n.includes('autenticacion') || n.includes('iniciar sesion');
    }) || clases.some((c: any) => {
        const n = c.data?.name?.toLowerCase() || '';
        return n.includes('usuario') || n.includes('user');
    });

    // Calcular endpoints estimados
    const crudEndpoints = clases.length * 5; // GET list, GET by id, POST, PATCH, DELETE
    const extraEndpoints = useCases.filter((uc: any) => {
        const n = uc.name?.toLowerCase() || '';
        return !n.includes('ver') && !n.includes('listar') && !n.includes('consultar') && !n.includes('buscar');
    }).length;
    const totalEndpoints = crudEndpoints + extraEndpoints + (hasAuth ? 3 : 0);

    // Calcular pantallas estimadas
    const screens = clases.map((c: any) => c.data?.name).filter(Boolean);

    // Nombre sugerido de BD
    const dbName = data.proyecto.nombre.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') + '_db';

    let md = `# 00_PROJECT_SUMMARY\n\n`;
    md += `> Este archivo es el punto de entrada. Leelo primero y ten en mente su contenido mientras lees el resto de los specs.\n\n`;

    md += `## Identidad del Proyecto\n\n`;
    md += `| Campo | Valor |\n| --- | --- |\n`;
    md += `| Nombre | **${data.proyecto.nombre}** |\n`;
    if (data.proyecto.descripcion) md += `| Descripcion | ${data.proyecto.descripcion} |\n`;
    md += `| Base de Datos | \`${dbName}\` (PostgreSQL) |\n`;
    md += `| Backend | NestJS + Prisma |\n`;
    md += `| Frontend | Next.js + React + TailwindCSS |\n`;
    md += `| Autenticacion | ${hasAuth ? 'SI - JWT con guards' : 'NO'} |\n`;
    md += `\n`;

    md += `## Metricas del Sistema\n\n`;
    md += `| Componente | Cantidad |\n| --- | --- |\n`;
    md += `| Actores | ${actors.length} |\n`;
    md += `| Casos de Uso | ${useCases.length} |\n`;
    md += `| Entidades / Tablas | ${clases.length} |\n`;
    if (enums.length > 0) md += `| Enums | ${enums.length} |\n`;
    md += `| Relaciones entre entidades | ${conexiones.length} |\n`;
    md += `| Flujos de proceso (diagramas de secuencia) | ${diagsSeq.length} |\n`;
    md += `| Endpoints REST estimados | ~${totalEndpoints} |\n`;
    md += `| Pantallas frontend estimadas | ~${screens.length * 2 + (hasAuth ? 2 : 0)} |\n`;
    md += `\n`;

    md += `## Entidades Principales\n\n`;
    if (clases.length === 0) {
        md += `No se definieron clases. Ver 03_DATA_MODEL.md.\n\n`;
    } else {
        for (const cls of clases) {
            const attrs = cls.data?.attributes || [];
            const attrNames = attrs.map((a: any) => a.name).slice(0, 4).join(', ');
            md += `- **${cls.data.name}** — Campos principales: ${attrNames || 'no definidos'}${attrs.length > 4 ? `, +${attrs.length - 4} mas` : ''}\n`;
        }
        md += `\n`;
    }

    if (enums.length > 0) {
        md += `## Enums Definidos\n\n`;
        for (const e of enums) {
            const vals = e.data?.values || [];
            md += `- **${e.data.name}**: ${vals.join(' | ')}\n`;
        }
        md += `\n`;
    }

    md += `## Casos de Uso Principales\n\n`;
    if (useCases.length === 0) {
        md += `No se definieron casos de uso. Ver 02_SYSTEM_REQUIREMENTS.md.\n\n`;
    } else {
        for (const uc of useCases) md += `- ${uc.name}\n`;
        md += `\n`;
    }

    if (hasAuth) {
        md += `## Autenticacion Requerida\n\n`;
        md += `El sistema requiere autenticacion. Implementar:\n\n`;
        md += `- Registro de usuario (\`POST /auth/register\`)\n`;
        md += `- Login (\`POST /auth/login\`) → devuelve JWT\n`;
        md += `- Validacion de token (\`GET /auth/me\`)\n`;
        md += `- Guard JWT en rutas protegidas (backend)\n`;
        md += `- Middleware de autenticacion en frontend (layout protegido)\n\n`;
    }

    md += `## Pantallas Frontend a Crear\n\n`;
    if (hasAuth) {
        md += `- /login — Inicio de sesion\n`;
        md += `- /register — Registro\n`;
    }
    for (const s of screens) {
        const route = s.toLowerCase().replace(/\s+/g, '-');
        md += `- /${route} — Listado de ${s}\n`;
        md += `- /${route}/[id] — Detalle / Edicion de ${s}\n`;
    }
    md += `\n`;

    md += `## Diagramas Disponibles\n\n`;
    md += `| Diagrama | Disponible |\n| --- | --- |\n`;
    md += `| Casos de Uso | ${diagCU ? '✅' : '❌'} |\n`;
    md += `| Clases | ${diagClases ? '✅' : '❌'} |\n`;
    md += `| Secuencia | ${diagsSeq.length > 0 ? `✅ (${diagsSeq.length})` : '❌'} |\n`;
    md += `| Paquetes | ${diagPaq ? '✅' : '❌'} |\n`;
    md += `\n`;

    md += `## Archivos de Especificacion (leer en este orden)\n\n`;
    md += `1. \`00_PROJECT_SUMMARY.md\` — Este archivo\n`;
    md += `2. \`01_AI_CONTEXT.md\` — Reglas del agente y stack\n`;
    md += `3. \`02_SYSTEM_REQUIREMENTS.md\` — Casos de uso y reglas de negocio\n`;
    md += `4. \`03_DATA_MODEL.md\` — Entidades, relaciones y schema Prisma\n`;
    md += `5. \`04_SYSTEM_ARCHITECTURE.md\` — Estructura de carpetas y modulos\n`;
    md += `6. \`05_WORKFLOWS.md\` — Flujos de proceso\n`;
    md += `7. \`06_IMPLEMENTATION_PHASES.md\` — Orden de construccion\n`;
    md += `8. \`07_UI_UX_GUIDELINES.md\` — Reglas visuales\n`;
    md += `9. \`08_DIAGNOSTICS.md\` — Advertencias y errores detectados\n`;

    return md;
}
