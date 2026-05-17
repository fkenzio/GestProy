import { SpecsData } from '../../servicios/specs.service';

const TYPE_MAP: Record<string, string> = {
    'int': 'Int', 'integer': 'Int', 'number': 'Int', 'numero': 'Int',
    'float': 'Float', 'double': 'Float', 'decimal': 'Float',
    'string': 'String', 'text': 'String', 'texto': 'String', 'varchar': 'String', 'char': 'String',
    'boolean': 'Boolean', 'bool': 'Boolean',
    'date': 'DateTime', 'datetime': 'DateTime', 'fecha': 'DateTime', 'timestamp': 'DateTime',
    'json': 'Json', 'object': 'Json'
};

const REL_MAP: Record<string, string> = {
    'asociacion': 'Asociacion', 'herencia': 'Herencia', 'implementacion': 'Implementacion',
    'composicion': 'Composicion (contiene)', 'agregacion': 'Agregacion (tiene)',
    'dependencia': 'Dependencia'
};

export function generarClassModel(data: SpecsData): string {
    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');
    if (!diagClases || !diagClases.datos) {
        return `# 03_DATA_MODEL\n\nNo se encontro diagrama de clases. Definir modelo de datos manualmente.\n`;
    }

    const elementos: any[] = diagClases.datos.elementos || [];
    const conexiones: any[] = diagClases.datos.conexiones || [];
    const entidades = elementos.filter((e: any) => e.type === 'clase' || e.type === 'interfaz' || e.type === 'enum');
    const clases = elementos.filter((e: any) => e.type === 'clase');

    let md = `# 03_DATA_MODEL\n\n## Descripcion General\n\nModelo de datos con **${entidades.length}** entidades y **${conexiones.length}** relaciones\n\n## Entidades\n\n`;

    for (const ent of entidades) {
        const d = ent.data;
        const tableName = d.name.toLowerCase().replace(/\s+/g, '_');
        md += `### ${d.name}\n\nTabla: \`${tableName}\`\n\n`;

        if (ent.type === 'enum' && d.values?.length > 0) {
            md += `**Tipo: Enum**\n\nValores: ${d.values.map((v: string) => `\`${v}\``).join(' | ')}\n\n---\n\n`;
            continue;
        }

        if (ent.type === 'interfaz') md += `**Tipo: Interfaz**\n\n`;

        const attrs = d.attributes || [];
        if (attrs.length > 0) {
            md += `#### Atributos\n\n| Campo | Tipo | Requerido | PK | Restricciones |\n| --- | --- | --- | --- | --- |\n`;
            for (const a of attrs) {
                const isPK = a.name.toLowerCase() === 'id';
                const prismaType = inferPrismaType(a.type, a.name);
                const constraints = isPK ? 'autoincrement' : inferConstraints(a.name);
                md += `| \`${a.name}\` | ${prismaType} | SI | ${isPK ? 'PK' : '-'} | ${constraints} |\n`;
            }
            md += `\n`;
        }

        const methods = d.methods || [];
        if (methods.length > 0) {
            md += `#### Metodos\n\n| Metodo | Parametros | Retorna |\n| --- | --- | --- |\n`;
            for (const m of methods) {
                md += `| \`${m.name}\` | ${m.params || '-'} | ${m.returnType || 'void'} |\n`;
            }
            md += `\n`;
        }

        const outRels = conexiones.filter((c: any) => c.sourceId === ent.id);
        const inRels = conexiones.filter((c: any) => c.targetId === ent.id);

        if (outRels.length > 0) {
            md += `#### Relaciones Salientes\n\n`;
            for (const r of outRels) {
                const target = elementos.find((e: any) => e.id === r.targetId);
                if (!target) continue;
                const tName = target.data?.name || '?';
                const relType = REL_MAP[r.type] || r.type;
                const multi = formatMultiplicity(r.sourceMulti, r.targetMulti, r.type);
                const cascade = r.type === 'composicion' ? ' [Eliminacion en cascada]' : '';
                const required = r.type === 'composicion' || r.type === 'herencia' ? ' [Obligatoria]' : ' [Opcional]';
                md += `- **${d.name}** ${multi} **${tName}** [${relType}]${cascade}${required}\n`;
            }
            md += `\n`;
        }

        if (inRels.length > 0) {
            md += `#### Relaciones Entrantes\n\n`;
            for (const r of inRels) {
                const source = elementos.find((e: any) => e.id === r.sourceId);
                if (!source) continue;
                const relType = REL_MAP[r.type] || r.type;
                md += `- **${source.data?.name}** -> **${d.name}** [${relType}]\n`;
            }
            md += `\n`;
        }

        md += `---\n\n`;
    }

    md += `## Matriz de Relaciones\n\n| Origen | Destino | Tipo | Multiplicidad | Requerida | Cascada Delete |\n| --- | --- | --- | --- | --- | --- |\n`;
    for (const c of conexiones) {
        const src = elementos.find((e: any) => e.id === c.sourceId)?.data?.name || '?';
        const tgt = elementos.find((e: any) => e.id === c.targetId)?.data?.name || '?';
        const relType = REL_MAP[c.type] || c.type;
        const multi = formatMultiplicity(c.sourceMulti, c.targetMulti, c.type);
        const required = c.type === 'composicion' || c.type === 'herencia' ? 'Obligatoria' : 'Opcional';
        const cascade = c.type === 'composicion' ? 'Si' : 'No';
        md += `| ${src} | ${tgt} | ${relType} | ${multi} | ${required} | ${cascade} |\n`;
    }
    md += `\n`;

    // --- SCHEMA PRISMA COMPLETO ---
    md += `## Schema Prisma (schema.prisma)\n\n`;
    md += `Copiar este schema directamente en \`backend/prisma/schema.prisma\`:\n\n`;
    md += '```prisma\n';
    md += generarSchemaPrisma(clases, elementos, conexiones);
    md += '```\n';

    return md;
}

function generarSchemaPrisma(clases: any[], todos: any[], conexiones: any[]): string {
    let schema = `generator client {\n  provider = "prisma-client-js"\n}\n\n`;
    schema += `datasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n`;

    // Enums
    const enums = todos.filter((e: any) => e.type === 'enum');
    for (const en of enums) {
        const vals: string[] = en.data?.values || [];
        if (vals.length === 0) continue;
        schema += `enum ${en.data.name} {\n`;
        for (const v of vals) schema += `  ${v.toUpperCase().replace(/\s+/g, '_')}\n`;
        schema += `}\n\n`;
    }

    for (const cls of clases) {
        const modelName = cls.data.name;
        const attrs = cls.data?.attributes || [];
        const outRels = conexiones.filter((c: any) => c.sourceId === cls.id && c.type !== 'herencia' && c.type !== 'dependencia');
        const inRels = conexiones.filter((c: any) => c.targetId === cls.id && c.type !== 'herencia' && c.type !== 'dependencia');

        schema += `model ${modelName} {\n`;

        // Siempre agregar id si no existe
        const hasId = attrs.some((a: any) => a.name.toLowerCase() === 'id');
        if (!hasId) schema += `  id        Int       @id @default(autoincrement())\n`;

        for (const a of attrs) {
            const prismaType = inferPrismaType(a.type, a.name);
            const isPK = a.name.toLowerCase() === 'id';
            const isEmail = a.name.toLowerCase() === 'correo' || a.name.toLowerCase() === 'email';
            const isFk = a.name.toLowerCase().endsWith('_id') || a.name.toLowerCase().startsWith('id_');
            let line = `  ${a.name.padEnd(12)}${prismaType}`;
            if (isPK) line += `  @id @default(autoincrement())`;
            else if (isEmail) line += `  @unique`;
            else if (isFk) line += `?`;
            schema += `${line}\n`;
        }

        // Timestamps
        schema += `  createdAt DateTime  @default(now())\n`;
        schema += `  updatedAt DateTime  @updatedAt\n`;

        // Relaciones salientes
        for (const r of outRels) {
            const target = todos.find((e: any) => e.id === r.targetId);
            if (!target?.data?.name) continue;
            const tName = target.data.name;
            const isComposicion = r.type === 'composicion' || r.type === 'agregacion';
            if (isComposicion) {
                schema += `  ${tName.toLowerCase()}s  ${tName}[]  @relation("${modelName}To${tName}")\n`;
            } else {
                schema += `  ${tName.toLowerCase()}   ${tName}?   @relation("${modelName}To${tName}")\n`;
            }
        }

        // Relaciones entrantes (FK)
        for (const r of inRels) {
            const source = todos.find((e: any) => e.id === r.sourceId);
            if (!source?.data?.name) continue;
            const sName = source.data.name;
            const fkField = `${sName.charAt(0).toLowerCase() + sName.slice(1)}Id`;
            schema += `  ${fkField.padEnd(12)}Int?\n`;
            schema += `  ${sName.charAt(0).toLowerCase() + sName.slice(1).padEnd(11)}${sName}?   @relation("${sName}To${modelName}", fields: [${fkField}], references: [id])\n`;
        }

        schema += `\n  @@map("${modelName.toLowerCase().replace(/\s+/g, '_')}")\n`;
        schema += `}\n\n`;
    }

    return schema;
}

function inferPrismaType(rawType: string, fieldName: string): string {
    if (!rawType) return inferFromFieldName(fieldName);
    const normalized = rawType.toLowerCase().trim();
    if (TYPE_MAP[normalized]) return TYPE_MAP[normalized];
    return 'String';
}

function inferFromFieldName(name: string): string {
    const lower = name.toLowerCase();
    if (lower === 'id') return 'Int';
    if (lower.endsWith('_id') || lower.startsWith('id_')) return 'Int';
    if (lower.includes('fecha') || lower.includes('date')) return 'DateTime';
    if (lower.includes('precio') || lower.includes('monto') || lower.includes('total') || lower.includes('costo')) return 'Float';
    if (lower.includes('cantidad') || lower.includes('numero') || lower.includes('edad') || lower.includes('count')) return 'Int';
    if (lower.startsWith('es_') || lower.startsWith('is_') || lower.includes('activo') || lower.includes('habilitado')) return 'Boolean';
    return 'String';
}

function inferConstraints(name: string): string {
    const lower = name.toLowerCase();
    if (lower === 'correo' || lower === 'email') return '@unique';
    if (lower.endsWith('_id') || lower.startsWith('id_')) return 'FK referencia';
    if (lower === 'password' || lower === 'contrasena' || lower === 'clave') return 'Hashear con bcrypt antes de guardar';
    return '-';
}

function formatMultiplicity(srcM: string, tgtM: string, type: string): string {
    if (type === 'herencia') return 'Herencia';
    if (type === 'implementacion') return 'Implementa';
    if (srcM && tgtM) return `${srcM}:${tgtM}`;
    if (type === 'composicion') return '1:N';
    if (type === 'agregacion') return '1:N';
    return 'N/A';
}
