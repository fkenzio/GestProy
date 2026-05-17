import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SpecsData } from '../servicios/specs.service';
import { generarProjectSummary } from './specs-templates/project-summary';
import { generarAgentInstructions } from './specs-templates/agent-instructions';
import { generarRequirements } from './specs-templates/requirements';
import { generarClassModel } from './specs-templates/class-model';
import { generarArchitecture } from './specs-templates/architecture';
import { generarProcess } from './specs-templates/process';
import { generarExecution } from './specs-templates/execution';
import { generarDesign } from './specs-templates/design';
import { generarValidationReport } from './specs-templates/validation-report';

export interface SpecsValidation {
    valido: boolean;
    errores: string[];
}

export function validarSpecs(data: SpecsData): SpecsValidation {
    const errores: string[] = [];
    const diagCU = data.diagramas.find((d: any) => d.tipo === 'casos_uso');
    const diagClases = data.diagramas.find((d: any) => d.tipo === 'clases');

    if (!diagClases || !diagClases.datos) {
        errores.push('Falta el diagrama de clases. Sin él, no se puede generar el modelo de datos ni el schema de base de datos.');
    } else {
        const clases = (diagClases.datos.elementos || []).filter((e: any) => e.type === 'clase');
        if (clases.length === 0) {
            errores.push('El diagrama de clases existe pero no tiene ninguna clase definida.');
        }
    }

    if (!diagCU || !diagCU.datos) {
        errores.push('Falta el diagrama de casos de uso. Sin él, no se pueden generar los requisitos del sistema.');
    } else {
        const useCases = diagCU.datos.useCases || [];
        if (useCases.length === 0) {
            errores.push('El diagrama de casos de uso existe pero no tiene casos de uso definidos.');
        }
    }

    return { valido: errores.length === 0, errores };
}

export async function generarSpecsZIP(data: SpecsData): Promise<void> {
    const zip = new JSZip();
    const folder = zip.folder('specs')!;

    folder.file('00_PROJECT_SUMMARY.md', generarProjectSummary(data));
    folder.file('01_AI_CONTEXT.md', generarAgentInstructions(data));
    folder.file('02_SYSTEM_REQUIREMENTS.md', generarRequirements(data));
    folder.file('03_DATA_MODEL.md', generarClassModel(data));
    folder.file('04_SYSTEM_ARCHITECTURE.md', generarArchitecture(data));
    folder.file('05_WORKFLOWS.md', generarProcess(data));
    folder.file('06_IMPLEMENTATION_PHASES.md', generarExecution(data));
    folder.file('07_UI_UX_GUIDELINES.md', generarDesign(data));
    folder.file('08_DIAGNOSTICS.md', generarValidationReport(data));

    const blob = await zip.generateAsync({ type: 'blob' });
    const name = `SPECS_${data.proyecto.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
    saveAs(blob, name);
}
