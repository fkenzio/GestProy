import { SpecsData } from '../../servicios/specs.service';

export function generarClassModel(data: SpecsData): string {
    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');

    if (!diagClases || !diagClases.datos) {
        return `# 03_DATA_MODEL\n\nNo se encontro diagrama de clases. El modelo de datos debera inferirse de los casos de uso.\n`;
    }

    const elementos: any[] = diagClases.datos.elementos || [];
    const conexiones: any[] = diagClases.datos.conexiones || [];

    const clases = elementos.filter((e: any) => e.type === 'clase');
    const enums = elementos.filter((e: any) => e.type === 'enum');

    let md = `# 03_DATA_MODEL\n\n`;
    md += `## OBJETIVO\n\nDefinicion estricta del modelo de datos para SQLAlchemy. El agente DEBE generar los modelos exactamente con estos campos y relaciones.\n\n`;

    md += `## DIAGRAMA UML ORIGINAL\n\n`;
    md += `A continuacion, la interpretacion texto a texto del diagrama UML:\n\n`;

    // UML List
    if (enums.length > 0) {
        md += `### Enumeraciones\n\n`;
        for (const e of enums) {
            md += `**Enum: ${e.data.name}**\n`;
            for (const val of e.data.values || []) {
                md += `- ${val}\n`;
            }
            md += `\n`;
        }
    }

    for (const c of clases) {
        md += `### Clase: ${c.data.name}\n\n`;
        const attrs = c.data.attributes || [];
        if (attrs.length > 0) {
            md += `**Atributos:**\n`;
            for (const a of attrs) {
                md += `- \`${a.name}\`: ${a.type}\n`;
            }
            md += `\n`;
        }
    }

    md += `### Relaciones UML\n\n`;
    if (conexiones.length === 0) md += `No hay relaciones definidas.\n\n`;
    for (const conn of conexiones) {
        const source = elementos.find((e: any) => e.id === conn.sourceId)?.data?.name || '?';
        const target = elementos.find((e: any) => e.id === conn.targetId)?.data?.name || '?';
        const label = conn.label ? ` (${conn.label})` : '';
        md += `- ${source} → ${target} [${conn.type}]${label}\n`;
    }
    md += `\n`;

    // Generador de código SQLAlchemy
    md += `## CODIGO AUTOGENERADO: FLASK SQLALCHEMY (\`models.py\`)\n\n`;
    md += `> [!IMPORTANT]\n> Agente: Este es el código SQLAlchemy generado automáticamente a partir del diagrama UML. Debes usarlo como base exacta para el archivo \`models.py\` en Flask.\n\n`;
    md += `\`\`\`python\n`;
    md += `from extensions import db\n`;
    md += `from datetime import datetime\n`;
    if (enums.length > 0) md += `import enum\n`;
    md += `\n`;

    // Enums Python
    for (const e of enums) {
        md += `class ${e.data.name}Enum(enum.Enum):\n`;
        const vals = e.data.values || [];
        for (const val of vals) {
            md += `    ${val.toUpperCase()} = "${val}"\n`;
        }
        md += `\n`;
    }

    // Clases / Modelos SQLAlchemy
    for (const c of clases) {
        const tableName = c.data.name.toLowerCase().replace(/\s+/g, '_');
        md += `class ${c.data.name}(db.Model):\n`;
        md += `    __tablename__ = '${tableName}'\n\n`;
        
        // Asumimos un ID autoincremental si no lo definieron explícitamente
        const attrs = c.data.attributes || [];
        let hasId = attrs.some((a: any) => a.name.toLowerCase() === 'id');
        if (!hasId) {
            md += `    id = db.Column(db.Integer, primary_key=True, autoincrement=True)\n`;
        }

        for (const a of attrs) {
            let pyType = 'db.String(255)';
            const tLower = a.type?.toLowerCase() || '';
            if (tLower.includes('int') || tLower.includes('number')) pyType = 'db.Integer';
            else if (tLower.includes('bool') || tLower.includes('boolean')) pyType = 'db.Boolean, default=False';
            else if (tLower.includes('date') || tLower.includes('time')) pyType = 'db.DateTime';
            else if (tLower.includes('text')) pyType = 'db.Text';
            else if (tLower.includes('float') || tLower.includes('decimal')) pyType = 'db.Float';
            
            // Check if it's an enum type
            const isEnum = enums.some((e: any) => e.data.name.toLowerCase() === tLower);
            if (isEnum) {
                const enumName = enums.find((e: any) => e.data.name.toLowerCase() === tLower).data.name;
                pyType = `db.Enum(${enumName}Enum)`;
            }

            const primary = a.name.toLowerCase() === 'id' ? ', primary_key=True, autoincrement=True' : '';
            md += `    ${a.name} = db.Column(${pyType}${primary})\n`;
        }

        // Relaciones inferidas
        const outRels = conexiones.filter((conn: any) => conn.sourceId === c.id);
        if (outRels.length > 0) {
            md += `\n    # Foreign Keys deducidas de UML\n`;
            for (const conn of outRels) {
                const targetCls = elementos.find((e: any) => e.id === conn.targetId);
                if (targetCls && targetCls.type === 'clase') {
                    const targetTable = targetCls.data.name.toLowerCase().replace(/\s+/g, '_');
                    const fkName = `${targetTable}_id`;
                    md += `    ${fkName} = db.Column(db.Integer, db.ForeignKey('${targetTable}.id'))\n`;
                    md += `    ${targetTable} = db.relationship('${targetCls.data.name}', backref='${tableName}s')\n`;
                }
            }
        }

        // Add standard timestamps
        md += `\n    # Timestamps\n`;
        md += `    created_at = db.Column(db.DateTime, default=datetime.utcnow)\n`;
        md += `    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)\n`;

        // Add to_dict method
        md += `\n    def to_dict(self):\n`;
        md += `        return {\n`;
        if (!hasId) md += `            'id': self.id,\n`;
        for (const a of attrs) {
            md += `            '${a.name}': self.${a.name}.value if isinstance(self.${a.name}, enum.Enum) else self.${a.name},\n`;
        }
        md += `            'created_at': self.created_at.isoformat() if self.created_at else None,\n`;
        md += `            'updated_at': self.updated_at.isoformat() if self.updated_at else None\n`;
        md += `        }\n`;

        md += `\n`;
    }

    md += `\`\`\`\n\n`;
    
    return md;
}
