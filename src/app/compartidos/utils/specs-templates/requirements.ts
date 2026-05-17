import { SpecsData } from '../../servicios/specs.service';

export function generarRequirements(data: SpecsData): string {
    const diagCU = data.diagramas.find((d: any) => d.tipo === 'casos_uso');
    const diagsSeq = data.diagramas.filter((d: any) => d.tipo === 'secuencia');
    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');

    if (!diagCU || !diagCU.datos) {
        return `# 02_SYSTEM_REQUIREMENTS\n\n## Descripcion General del Sistema\n\nSistema: **${data.proyecto.nombre}**\n\n${data.proyecto.descripcion || ''}\n\nNo se encontro diagrama de casos de uso. Definir requisitos manualmente.\n`;
    }

    const datos = diagCU.datos;
    const actors: any[] = datos.actors || [];
    const useCases: any[] = datos.useCases || [];
    const relations: any[] = datos.relations || [];
    const boundaries: any[] = datos.boundaries || [];
    const clases: any[] = diagClases?.datos?.elementos?.filter((e: any) => e.type === 'clase') || [];

    // --- Detectar reglas de negocio implícitas ---
    const implicitRules: string[] = [];
    const ucNames = useCases.map((uc: any) => uc.name?.toLowerCase() || '');
    const claseNames = clases.map((c: any) => c.data?.name?.toLowerCase() || '');

    const hasLogin = ucNames.some(n => n.includes('login') || n.includes('iniciar sesion') || n.includes('autenticacion'));
    const hasRegister = ucNames.some(n => n.includes('registro') || n.includes('registrar') || n.includes('crear cuenta'));
    const hasUser = claseNames.some(n => n.includes('usuario') || n.includes('user'));
    const hasRole = claseNames.some(n => n.includes('rol') || n.includes('role'));
    const hasProfile = ucNames.some(n => n.includes('perfil') || n.includes('profile'));
    const hasPassword = ucNames.some(n => n.includes('contrasena') || n.includes('password') || n.includes('cambiar clave'));
    const hasDelete = ucNames.some(n => n.includes('eliminar') || n.includes('borrar') || n.includes('delete'));
    const hasSearch = ucNames.some(n => n.includes('buscar') || n.includes('search') || n.includes('filtrar'));
    const hasPagination = clases.length > 1;

    if (hasLogin) {
        implicitRules.push('**[AUTH-001]** El sistema debe usar JWT (JSON Web Tokens) para autenticacion. El token debe incluirse en el header Authorization: Bearer <token>.');
        implicitRules.push('**[AUTH-002]** Las contrasenas deben hashearse con bcrypt antes de guardarse en base de datos. Nunca guardar contrasena en texto plano.');
        implicitRules.push('**[AUTH-003]** El JWT debe tener expiracion configurada (recomendado: 7 dias). Implementar refresh token si se requiere sesion persistente.');
    }
    if (hasRegister) {
        implicitRules.push('**[AUTH-004]** Al registrarse, validar que el correo no este ya en uso. Devolver error claro si esta duplicado.');
    }
    if (hasRole) {
        implicitRules.push('**[RBAC-001]** El sistema tiene roles. Implementar guards que validen el rol del usuario antes de permitir acciones privilegiadas.');
    }
    if (hasProfile) {
        implicitRules.push('**[PROFILE-001]** El usuario solo puede editar su propio perfil. Nunca permitir que un usuario modifique el perfil de otro.');
    }
    if (hasPassword) {
        implicitRules.push('**[AUTH-005]** Al cambiar contrasena, verificar la contrasena actual antes de permitir el cambio.');
    }
    if (hasDelete) {
        implicitRules.push('**[DATA-001]** Al eliminar registros, implementar soft delete (campo deletedAt) para mantener historial, a menos que el caso de uso especifique eliminacion permanente.');
    }
    if (hasSearch) {
        implicitRules.push('**[DATA-002]** Las busquedas deben ser insensibles a mayusculas/minusculas. Usar ILIKE en PostgreSQL o toLowerCase en la logica.');
    }
    if (hasPagination) {
        implicitRules.push('**[DATA-003]** Los listados deben soportar paginacion. Implementar parametros ?page=1&limit=10 en todos los endpoints GET de listas.');
    }
    if (hasUser) {
        implicitRules.push('**[DATA-004]** Todos los registros creados por un usuario deben guardar referencia al usuario creador (campo createdBy o userId).');
    }

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
            const ucNames2 = actorRels.map((r: any) => {
                const ucId = r.sourceId === actor.id ? r.targetId : r.sourceId;
                return useCases.find((u: any) => u.id === ucId)?.name;
            }).filter(Boolean);
            md += `- **${actor.name}**`;
            if (ucNames2.length > 0) md += ` — Participa en: ${ucNames2.join(', ')}`;
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
            md += `#### Incluye\n\n`;
            for (const inc of includes) {
                const target = useCases.find((u: any) => u.id === inc.targetId);
                if (target) md += `- **${target.name}**\n`;
            }
            md += `\n`;
        }

        const extends_ = relations.filter((r: any) => r.type === 'extend' && r.sourceId === uc.id);
        if (extends_.length > 0) {
            md += `#### Extiende\n\n`;
            for (const ext of extends_) {
                const target = useCases.find((u: any) => u.id === ext.targetId);
                if (target) md += `- **${target.name}**\n`;
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

    if (implicitRules.length > 0) {
        md += `## Reglas de Negocio Implicitas\n\n`;
        md += `Las siguientes reglas se deducen automaticamente del modelo y casos de uso. El agente DEBE implementarlas:\n\n`;
        for (const rule of implicitRules) md += `- ${rule}\n`;
        md += `\n`;
    }

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
