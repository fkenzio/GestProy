import { SpecsData } from '../../servicios/specs.service';

export function generarRequirements(data: SpecsData): string {
    const diagCU = data.diagramas.find((d: any) => d.tipo === 'casos_uso');
    const diagsSeq = data.diagramas.filter((d: any) => d.tipo === 'secuencia');

    if (!diagCU || !diagCU.datos) {
        return `# 02_SYSTEM_REQUIREMENTS\n\n## Descripcion General del Sistema\n\nSistema: **${data.proyecto.nombre}**\n\n${data.proyecto.descripcion || ''}\n\nNo se encontro diagrama de casos de uso. Definir requisitos manualmente.\n`;
    }

    const datos = diagCU.datos;
    const actors: any[] = datos.actors || [];
    const useCases: any[] = datos.useCases || [];
    const relations: any[] = datos.relations || [];
    const boundaries: any[] = datos.boundaries || [];

    let md = `# 02_SYSTEM_REQUIREMENTS\n\n## Descripcion General del Sistema\n\nSistema: **${data.proyecto.nombre}**\n\n`;
    if (data.proyecto.descripcion) md += `${data.proyecto.descripcion}\n\n`;

    if (boundaries.length > 0) {
        md += `## Limites del Sistema\n\n`;
        for (const b of boundaries) md += `- **${b.name}**\n`;
        md += `\n`;
    }

    md += `## Actores del Sistema\n\n`;
    if (actors.length === 0) {
        md += `No se definieron actores.\n\n`;
    } else {
        for (const actor of actors) {
            const actorRels = relations.filter((r: any) =>
                r.type === 'association' && (r.sourceId === actor.id || r.targetId === actor.id)
            );
            const ucNames = actorRels.map((r: any) => {
                const ucId = r.sourceId === actor.id ? r.targetId : r.sourceId;
                return useCases.find((u: any) => u.id === ucId)?.name;
            }).filter(Boolean);

            md += `- **${actor.name}**`;
            if (ucNames.length > 0) md += ` — Participa en: ${ucNames.join(', ')}`;
            md += `\n`;
        }
        md += `\n`;
    }

    md += `## Casos de Uso Detallados\n\n`;

    for (const uc of useCases) {
        md += `### ${uc.name}\n\n`;

        const actorRels = relations.filter((r: any) =>
            r.type === 'association' && (r.sourceId === uc.id || r.targetId === uc.id)
        );
        const participatingActors = actorRels.map((r: any) => {
            const otherId = r.sourceId === uc.id ? r.targetId : r.sourceId;
            return actors.find((a: any) => a.id === otherId)?.name;
        }).filter(Boolean);

        if (participatingActors.length > 0) {
            md += `#### Actores Participantes\n\n`;
            for (const a of participatingActors) md += `- ${a}\n`;
            md += `\n`;
        }

        const includes = relations.filter((r: any) => r.type === 'include' && r.sourceId === uc.id);
        if (includes.length > 0) {
            md += `#### Incluye (Relaciones Include)\n\n`;
            for (const inc of includes) {
                const target = useCases.find((u: any) => u.id === inc.targetId);
                if (target) md += `- Incluye el caso de uso: **${target.name}**\n`;
            }
            md += `\n`;
        }

        const extends_ = relations.filter((r: any) => r.type === 'extend' && r.sourceId === uc.id);
        if (extends_.length > 0) {
            md += `#### Extiende (Relaciones Extend)\n\n`;
            for (const ext of extends_) {
                const target = useCases.find((u: any) => u.id === ext.targetId);
                if (target) md += `- Extiende el caso de uso: **${target.name}**\n`;
            }
            md += `\n`;
        }

        const matchedSeq = findMatchingSequence(uc.name, diagsSeq);
        if (matchedSeq) {
            const seqData = matchedSeq.datos || {};
            const lifelines: any[] = seqData.lifelines || [];
            const messages: any[] = seqData.messages || [];

            if (messages.length > 0) {
                md += `#### Flujos de Ejecucion\n\n`;
                md += `- **${matchedSeq.nombre}** - ${messages.length} pasos\n`;
                for (let i = 0; i < messages.length; i++) {
                    const msg = messages[i];
                    const src = lifelines.find((l: any) => l.id === msg.sourceId)?.name || '?';
                    const tgt = lifelines.find((l: any) => l.id === msg.targetId)?.name || '?';
                    md += `  - [${i + 1}] ${src} -> ${tgt}: ${msg.name}\n`;
                }
                md += `\n`;
            }
        }

        md += `---\n\n`;
    }

    md += `## Matriz de Relaciones entre Casos de Uso\n\n`;
    md += `| Caso de Uso | Incluye | Extiende |\n| --- | --- | --- |\n`;
    for (const uc of useCases) {
        const inc = relations.filter((r: any) => r.type === 'include' && r.sourceId === uc.id)
            .map((r: any) => useCases.find((u: any) => u.id === r.targetId)?.name).filter(Boolean).join(', ') || '-';
        const ext = relations.filter((r: any) => r.type === 'extend' && r.sourceId === uc.id)
            .map((r: any) => useCases.find((u: any) => u.id === r.targetId)?.name).filter(Boolean).join(', ') || '-';
        md += `| ${uc.name} | ${inc} | ${ext} |\n`;
    }
    md += `\n`;

    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');
    if (diagClases?.datos) {
        const elementos: any[] = diagClases.datos.elementos || [];
        const entidades = elementos.filter((e: any) => e.type === 'clase' || e.type === 'interfaz');
        if (entidades.length > 0) {
            md += `## Entidades de Negocio Involucradas\n\n`;
            for (const ent of entidades) {
                const attrCount = ent.data?.attributes?.length || 0;
                md += `- **${ent.data.name}** - ${attrCount} atributos\n`;
            }
        }
    }

    return md;
}

function findMatchingSequence(ucName: string, diagsSeq: any[]): any | null {
    const normalizado = ucName.toLowerCase().replace(/\s+/g, '');
    for (const seq of diagsSeq) {
        const seqNorm = seq.nombre.toLowerCase().replace(/\s+/g, '');
        if (seqNorm.includes(normalizado) || normalizado.includes(seqNorm)) return seq;
    }
    const palabras = ucName.toLowerCase().split(/\s+/);
    for (const seq of diagsSeq) {
        const seqLower = seq.nombre.toLowerCase();
        const match = palabras.filter((p: string) => p.length > 3 && seqLower.includes(p));
        if (match.length >= Math.ceil(palabras.length * 0.5)) return seq;
    }
    return null;
}
