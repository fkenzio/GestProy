import { SpecsData } from '../../servicios/specs.service';

export function generarValidationReport(data: SpecsData): string {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    const diagCU = data.diagramas.find((d: any) => d.tipo === 'casos_uso');
    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');
    const diagsSeq = data.diagramas.filter((d: any) => d.tipo === 'secuencia');
    const diagPaq = data.diagramas.find((d: any) => d.tipo === 'paquetes');

    if (!diagCU) errors.push('[MISSING_DIAGRAM] No existe diagrama de casos de uso. Los requisitos no podran generarse automaticamente.');
    if (!diagClases) errors.push('[MISSING_DIAGRAM] No existe diagrama de clases. El modelo de datos no podra generarse automaticamente.');
    if (diagsSeq.length === 0) warnings.push('[MISSING_DIAGRAM] No existen diagramas de secuencia. Los flujos de proceso estaran vacios.');
    if (!diagPaq) warnings.push('[NO_PACKAGE_DIAGRAM] No existe diagrama de paquetes. La arquitectura usara un template por defecto.');

    if (diagCU?.datos) {
        const useCases: any[] = diagCU.datos.useCases || [];
        const actors: any[] = diagCU.datos.actors || [];
        const relations: any[] = diagCU.datos.relations || [];

        if (useCases.length === 0) errors.push('[EMPTY_USE_CASES] El diagrama de casos de uso no tiene casos de uso definidos.');
        if (actors.length === 0) warnings.push('[NO_ACTORS] El diagrama de casos de uso no tiene actores definidos.');

        for (const uc of useCases) {
            const hasActor = relations.some((r: any) =>
                r.type === 'association' && (r.sourceId === uc.id || r.targetId === uc.id) &&
                actors.some((a: any) => a.id === r.sourceId || a.id === r.targetId)
            );
            if (!hasActor) warnings.push(`[ORPHAN_USE_CASE] El caso de uso "${uc.name}" no tiene actor asociado.`);

            const hasSeq = diagsSeq.some((seq: any) => {
                const norm1 = uc.name.toLowerCase().replace(/\s+/g, '');
                const norm2 = seq.nombre.toLowerCase().replace(/\s+/g, '');
                return norm1.includes(norm2) || norm2.includes(norm1);
            });
            if (!hasSeq) warnings.push(`[USE_CASE_WITHOUT_SEQUENCE] El caso de uso "${uc.name}" no tiene diagrama de secuencia asociado.`);
        }
    }

    if (diagClases?.datos) {
        const elementos: any[] = diagClases.datos.elementos || [];
        const conexiones: any[] = diagClases.datos.conexiones || [];
        const clases = elementos.filter((e: any) => e.type === 'clase');

        for (const cls of clases) {
            const attrs = cls.data?.attributes || [];
            const hasId = attrs.some((a: any) => a.name.toLowerCase() === 'id');
            if (!hasId) warnings.push(`[NO_PK] La clase "${cls.data.name}" no tiene campo "id" definido.`);

            const hasRelation = conexiones.some((c: any) => c.sourceId === cls.id || c.targetId === cls.id);
            if (!hasRelation) warnings.push(`[ISOLATED_CLASS] La clase "${cls.data.name}" no tiene relaciones con otras clases.`);

            suggestions.push(`[CRUD_SUGGESTION] Considerar casos de uso CRUD para ${cls.data.name}.`);
        }
    }

    let md = `# 08_DIAGNOSTICS\n\n`;

    md += `## Errores\n\n`;
    if (errors.length === 0) md += `Sin errores criticos.\n\n`;
    else for (const e of errors) md += `- ${e}\n`;
    md += `\n`;

    md += `## Advertencias\n\n`;
    if (warnings.length === 0) md += `Sin advertencias.\n\n`;
    else for (const w of warnings) md += `- ${w}\n`;
    md += `\n`;

    md += `## Sugerencias\n\n`;
    if (suggestions.length === 0) md += `Sin sugerencias.\n\n`;
    else for (const s of suggestions) md += `- ${s}\n`;

    return md;
}
