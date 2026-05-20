import { SpecsData } from '../../servicios/specs.service';

export function generarRequirements(data: SpecsData): string {
    const diagCU = data.diagramas.find((d: any) => d.tipo === 'casos_uso');
    const diagsSeq = data.diagramas.filter((d: any) => d.tipo === 'secuencia');
    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');

    const clases: any[] = diagClases?.datos?.elementos?.filter((e: any) => e.type === 'clase') || [];

    // ── Datos de procesos/subprocesos/requerimientos ──────────────────────────
    const procesos: any[] = data.procesos || [];
    const subprocesos: any[] = data.subprocesos || [];
    const requerimientos: any[] = data.requerimientos || [];

    // Agrupar subprocesos por proceso
    const subsByProceso: Record<number, any[]> = {};
    for (const sub of subprocesos) {
        if (!subsByProceso[sub.proceso_id]) subsByProceso[sub.proceso_id] = [];
        subsByProceso[sub.proceso_id].push(sub);
    }

    // Agrupar requerimientos por subproceso
    const reqsBySubproceso: Record<number, any[]> = {};
    for (const req of requerimientos) {
        if (!reqsBySubproceso[req.subproceso_id]) reqsBySubproceso[req.subproceso_id] = [];
        reqsBySubproceso[req.subproceso_id].push(req);
    }

    // ── Datos de diagrama de CU ────────────────────────────────────────────────
    const datos = diagCU?.datos || {};
    const actors: any[] = datos.actors || [];
    const useCases: any[] = datos.useCases || [];
    const relations: any[] = datos.relations || [];
    const boundaries: any[] = datos.boundaries || [];

    // ── Detectar reglas implícitas ─────────────────────────────────────────────
    const implicitRules: string[] = [];
    const ucNames = useCases.map((uc: any) => uc.name?.toLowerCase() || '');
    const reqTitles = requerimientos.map((r: any) => r.titulo?.toLowerCase() || '');
    const claseNames = clases.map((c: any) => c.data?.name?.toLowerCase() || '');
    const allTextLower = [...ucNames, ...reqTitles];

    const hasLogin = allTextLower.some(n => n.includes('login') || n.includes('iniciar sesion') || n.includes('autenticacion'));
    const hasRegister = allTextLower.some(n => n.includes('registro') || n.includes('registrar') || n.includes('crear cuenta'));
    const hasUser = claseNames.some(n => n.includes('usuario') || n.includes('user'));
    const hasRole = claseNames.some(n => n.includes('rol') || n.includes('role'));
    const hasProfile = allTextLower.some(n => n.includes('perfil') || n.includes('profile'));
    const hasPassword = allTextLower.some(n => n.includes('contrasena') || n.includes('password') || n.includes('cambiar clave'));
    const hasDelete = allTextLower.some(n => n.includes('eliminar') || n.includes('borrar') || n.includes('delete'));
    const hasSearch = allTextLower.some(n => n.includes('buscar') || n.includes('search') || n.includes('filtrar'));
    const hasPagination = clases.length > 1;

    if (hasLogin) {
        implicitRules.push('**[AUTH-001]** Usar JWT. Token en header Authorization: Bearer <token>.');
        implicitRules.push('**[AUTH-002]** Hashear contrasenas con bcrypt. Nunca guardar en texto plano.');
        implicitRules.push('**[AUTH-003]** JWT con expiracion de 7 dias.');
    }
    if (hasRegister) implicitRules.push('**[AUTH-004]** Validar correo no duplicado al registrar.');
    if (hasRole) implicitRules.push('**[RBAC-001]** Implementar guards de rol en rutas protegidas.');
    if (hasProfile) implicitRules.push('**[PROFILE-001]** Usuario solo puede editar su propio perfil.');
    if (hasPassword) implicitRules.push('**[AUTH-005]** Verificar contrasena actual antes de permitir cambio.');
    if (hasDelete) implicitRules.push('**[DATA-001]** Considerar soft delete (campo deletedAt) para mantener historial.');
    if (hasSearch) implicitRules.push('**[DATA-002]** Busquedas insensibles a mayusculas (ILIKE en PostgreSQL).');
    if (hasPagination) implicitRules.push('**[DATA-003]** Soportar paginacion en listados: ?page=1&limit=10.');
    if (hasUser) implicitRules.push('**[DATA-004]** Registros deben guardar referencia al usuario creador.');
    implicitRules.push('**[API-001]** Todo error en Flask DEBE retornar un JSON con formato `{"error": "Mensaje descriptivo"}` y su codigo HTTP correcto (400, 404, 500).');

    // ── Construcción del MD ────────────────────────────────────────────────────
    let md = `# 02_SYSTEM_REQUIREMENTS\n\n## Descripcion General del Sistema\n\nSistema: **${data.proyecto.nombre}**\n\n`;
    if (data.proyecto.descripcion) md += `${data.proyecto.descripcion}\n\n`;

    // Boundaries
    if (boundaries.length > 0) {
        md += `## Limites del Sistema\n\n`;
        for (const b of boundaries) md += `- **${b.name}**\n`;
        md += `\n`;
    }

    // Actores del diagrama
    md += `## Actores del Sistema\n\n`;
    if (actors.length === 0) {
        md += `No se definieron actores en el diagrama de casos de uso.\n\n`;
    } else {
        for (const actor of actors) {
            const actorRels = relations.filter((r: any) =>
                r.type === 'association' && (r.sourceId === actor.id || r.targetId === actor.id)
            );
            const ucNamesForActor = actorRels.map((r: any) => {
                const ucId = r.sourceId === actor.id ? r.targetId : r.sourceId;
                return useCases.find((u: any) => u.id === ucId)?.name;
            }).filter(Boolean);
            md += `- **${actor.name}**`;
            if (ucNamesForActor.length > 0) md += ` — Participa en: ${ucNamesForActor.join(', ')}`;
            md += `\n`;
        }
        md += `\n`;
    }

    // Casos de uso
    if (useCases.length > 0) {
        md += `## Casos de Uso\n\n`;
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
                md += `**Actores:** ${participatingActors.join(', ')}\n\n`;
            }

            const includes = relations.filter((r: any) => r.type === 'include' && r.sourceId === uc.id);
            if (includes.length > 0) {
                md += `**Incluye:** ${includes.map((inc: any) => useCases.find((u: any) => u.id === inc.targetId)?.name).filter(Boolean).join(', ')}\n\n`;
            }

            const extends_ = relations.filter((r: any) => r.type === 'extend' && r.sourceId === uc.id);
            if (extends_.length > 0) {
                md += `**Extiende:** ${extends_.map((ext: any) => useCases.find((u: any) => u.id === ext.targetId)?.name).filter(Boolean).join(', ')}\n\n`;
            }

            const matchedSeq = findMatchingSequence(uc.name, diagsSeq);
            if (matchedSeq) {
                const lifelines: any[] = matchedSeq.datos?.lifelines || [];
                const messages: any[] = matchedSeq.datos?.messages || [];
                if (messages.length > 0) {
                    md += `**Flujo de ejecucion:**\n\n`;
                    for (let i = 0; i < messages.length; i++) {
                        const msg = messages[i];
                        const src = lifelines.find((l: any) => l.id === msg.sourceId)?.name || '?';
                        const tgt = lifelines.find((l: any) => l.id === msg.targetId)?.name || '?';
                        md += `  ${i + 1}. ${src} → ${tgt}: ${msg.name}\n`;
                    }
                    md += `\n`;
                }
            }

            md += `---\n\n`;
        }
    }

    // ── SECCIÓN PRINCIPAL NUEVA: Requerimientos formales ──────────────────────
    if (procesos.length > 0) {
        md += `## Requerimientos Formales del Sistema\n\n`;
        md += `> Documentados mediante técnicas de recolección de información.\n\n`;

        // Contadores globales por tipo
        const totalFuncionales = requerimientos.filter((r: any) => r.tipo === 'funcional').length;
        const totalNoFuncionales = requerimientos.filter((r: any) => r.tipo === 'no_funcional').length;

        md += `**Total de requerimientos:** ${requerimientos.length} `;
        md += `(${totalFuncionales} funcionales, ${totalNoFuncionales} no funcionales)\n\n`;

        for (const proceso of procesos) {
            const subs = subsByProceso[proceso.id] || [];
            const reqsEnProceso = subs.flatMap((s: any) => reqsBySubproceso[s.id] || []);
            if (reqsEnProceso.length === 0 && subs.length === 0) continue;

            md += `### Proceso: ${proceso.nombre}\n\n`;
            if (proceso.descripcion) md += `**Descripcion:** ${proceso.descripcion}\n\n`;
            if (proceso.objetivo) md += `**Objetivo:** ${proceso.objetivo}\n\n`;

            for (const sub of subs) {
                const reqs = reqsBySubproceso[sub.id] || [];
                if (reqs.length === 0) continue;

                md += `#### Subproceso: ${sub.nombre}\n\n`;
                if (sub.descripcion) md += `${sub.descripcion}\n\n`;

                md += `| Codigo | Titulo | Tipo | Prioridad | Técnica de Recoleccion | Estado |\n`;
                md += `| --- | --- | --- | --- | --- | --- |\n`;

                for (const req of reqs) {
                    const tecnica = req.tecnica_nombre || 'No especificada';
                    const tipo = req.tipo === 'funcional' ? 'Funcional' : req.tipo === 'no_funcional' ? 'No Funcional' : req.tipo || '-';
                    const prioridad = req.prioridad || '-';
                    const estado = req.estado || '-';
                    md += `| ${req.codigo} | ${req.titulo} | ${tipo} | ${prioridad} | ${tecnica} | ${estado} |\n`;
                }
                md += `\n`;

                // Detalle de cada requerimiento con descripción y criterios
                for (const req of reqs) {
                    md += `##### ${req.codigo} — ${req.titulo}\n\n`;
                    if (req.descripcion) md += `${req.descripcion}\n\n`;

                    if (req.tecnica_nombre) {
                        md += `**Técnica de recolección:** ${req.tecnica_nombre}`;
                        if (req.tecnica_categoria) md += ` (${req.tecnica_categoria})`;
                        md += `\n\n`;
                    }

                    const criterios: any[] = req.criterios || [];
                    if (criterios.length > 0) {
                        md += `**Criterios de aceptacion:**\n\n`;
                        for (const c of criterios) {
                            md += `- ${c.descripcion}\n`;
                        }
                        md += `\n`;
                    }
                }
            }
        }
    }

    // Reglas implícitas
    if (implicitRules.length > 0) {
        md += `## Reglas de Negocio Implicitas\n\n`;
        md += `Las siguientes reglas se deducen automaticamente del modelo y requisitos. El agente DEBE implementarlas:\n\n`;
        for (const rule of implicitRules) md += `- ${rule}\n`;
        md += `\n`;
    }

    // Matriz de CU
    if (useCases.length > 0) {
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
    }

    // Entidades de negocio
    if (clases.length > 0) {
        md += `## Entidades de Negocio Involucradas\n\n`;
        for (const cls of clases) {
            const attrCount = cls.data?.attributes?.length || 0;
            md += `- **${cls.data.name}** — ${attrCount} atributos\n`;
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
