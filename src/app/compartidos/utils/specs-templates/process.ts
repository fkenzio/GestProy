import { SpecsData } from '../../servicios/specs.service';

export function generarProcess(data: SpecsData): string {
    const diagramas = data.diagramas.filter((d: any) => d.tipo === 'secuencia');

    if (diagramas.length === 0) {
        return `# 05_WORKFLOWS\n\nNo se encontraron diagramas de secuencia. Definir flujos de proceso manualmente.\n`;
    }

    let totalFlujos = 0;
    let md = `# 05_WORKFLOWS\n\n## Descripcion General\n\n`;

    for (const diag of diagramas) {
        const datos = diag.datos || {};
        const lifelines: any[] = datos.lifelines || [];
        const messages: any[] = datos.messages || [];
        if (messages.length === 0) continue;
        totalFlujos++;

        const flowName = diag.nombre.replace(/\s+/g, '');
        const actorLL = lifelines.find((l: any) => l.type === 'actor');
        const hasDB = lifelines.some((l: any) => {
            const n = l.name?.toLowerCase() || '';
            return n.includes('bd') || n.includes('database') || n.includes('db') || n.includes('prisma');
        });
        const hasMutations = messages.some((m: any) => {
            const n = m.name?.toLowerCase() || '';
            return n.includes('create') || n.includes('update') || n.includes('delete') || n.includes('registrar') || n.includes('crear') || n.includes('actualizar') || n.includes('eliminar');
        });
        const needsTransaction = hasMutations && messages.length > 5;

        md += `## ${flowName}\n\n### Informacion General\n\n`;
        md += `**Actores Involucrados**: ${actorLL?.name || 'No definido'}\n\n`;
        if (needsTransaction) {
            md += `**Requiere Transaccion**: SI - Este flujo debe ejecutarse como una unidad atomica\n\n`;
        } else {
            md += `**Requiere Transaccion**: NO\n\n`;
        }

        md += `### Flujo Principal\n\n| Paso | Origen | Destino | Accion | Capa | Hint de Implementacion |\n| --- | --- | --- | --- | --- | --- |\n`;

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const src = lifelines.find((l: any) => l.id === msg.sourceId)?.name || '?';
            const tgt = lifelines.find((l: any) => l.id === msg.targetId)?.name || '?';
            const layer = inferLayer(src, tgt, msg.name, lifelines);
            const hint = inferHint(msg.name, src, tgt);
            md += `| ${i + 1} | ${src} | ${tgt} | ${msg.name} | ${layer} | ${hint} |\n`;
        }

        md += `\n### Secuencia Visual\n\n\`\`\`txt\n`;
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const src = lifelines.find((l: any) => l.id === msg.sourceId)?.name || '?';
            const tgt = lifelines.find((l: any) => l.id === msg.targetId)?.name || '?';
            md += `${src} -> ${msg.name} -> ${tgt}\n`;
            if (i < messages.length - 1) md += `  |\n`;
        }
        md += `\`\`\`\n\n`;

        const altMessages = messages.filter((m: any) => {
            const n = m.name?.toLowerCase() || '';
            return n.includes('alt') || n.includes('error') || n.includes('false') || n.includes('no disponible') || n.includes('invalido');
        });
        if (altMessages.length > 0) {
            md += `### Flujos Alternativos\n\n`;
            for (const m of altMessages) md += `- **Alternativa**: ${m.name}\n`;
            md += `\n`;
        }

        md += `### Detalles de Implementacion\n\n`;

        const firstLL = lifelines.find((l: any) => l.id === messages[0]?.sourceId);
        const lastMsg = messages[messages.length - 1];
        const lastLL = lifelines.find((l: any) => l.id === lastMsg?.targetId);
        md += `#### Validaciones Requeridas\n\n`;
        md += `- Debe iniciarse desde: **${firstLL?.name || '?'}**\n`;
        md += `- Resultado final esperado: **${lastLL?.name || '?'}**\n`;
        if (needsTransaction) md += `- Garantizar atomicidad: si algun paso falla, revertir todos los cambios\n`;
        md += `\n`;

        const affectedEntities = [...new Set(lifelines.filter((l: any) => l.type !== 'actor').map((l: any) => l.name))];
        if (affectedEntities.length > 0) {
            md += `#### Entidades de Base de Datos Afectadas\n\n`;
            for (const e of affectedEntities) md += `- ${e}\n`;
            md += `\n`;
        }

        md += `---\n\n`;
    }

    md = md.replace('## Descripcion General\n\n', `## Descripcion General\n\nSe describen **${totalFlujos}** flujos de proceso.\n\n`);

    md += `## Resumen de Procesos\n\n| Proceso | Pasos | Actores | Transaccion | Flujos Alternos |\n| --- | --- | --- | --- | --- |\n`;
    for (const diag of diagramas) {
        const datos = diag.datos || {};
        const messages: any[] = datos.messages || [];
        const lifelines: any[] = datos.lifelines || [];
        if (messages.length === 0) continue;
        const actor = lifelines.find((l: any) => l.type === 'actor')?.name || 'N/A';
        const hasAlt = messages.some((m: any) => (m.name?.toLowerCase() || '').includes('alt') || (m.name?.toLowerCase() || '').includes('error'));
        md += `| ${diag.nombre} | ${messages.length} | ${actor} | ${messages.length > 5 ? 'Posible' : 'No'} | ${hasAlt ? 'Si' : 'No'} |\n`;
    }

    return md;
}

function inferLayer(src: string, tgt: string, action: string, lifelines: any[]): string {
    const srcLL = lifelines.find((l: any) => l.name === src);
    const tgtLL = lifelines.find((l: any) => l.name === tgt);
    const actionLower = action.toLowerCase();

    if (srcLL?.type === 'actor' || tgtLL?.type === 'actor') return 'presentation';
    if (actionLower.includes('prisma') || actionLower.includes('bd') || actionLower.includes('database') || actionLower.includes('query')) return 'persistence';
    if (actionLower.includes('create') || actionLower.includes('update') || actionLower.includes('delete') || actionLower.includes('validar') || actionLower.includes('registrar')) return 'domain';
    return 'application';
}

function inferHint(action: string, src: string, tgt: string): string {
    const lower = action.toLowerCase();
    if (lower.includes('create') || lower.includes('crear') || lower.includes('registrar')) return `Crear registro en ${tgt}`;
    if (lower.includes('buscar') || lower.includes('find') || lower.includes('get')) return `Buscar en ${tgt}`;
    if (lower.includes('validar') || lower.includes('verificar')) return `Validar estado en ${tgt}`;
    if (lower.includes('actualizar') || lower.includes('update')) return `Actualizar registro en ${tgt}`;
    if (lower.includes('delete') || lower.includes('eliminar')) return `Eliminar registro en ${tgt}`;
    return `Implementar paso de negocio: ${action}`;
}
