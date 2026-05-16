import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SpecsData } from '../servicios/specs.service';
import { generarAgentInstructions } from './specs-templates/agent-instructions';
import { generarRequirements } from './specs-templates/requirements';
import { generarClassModel } from './specs-templates/class-model';
import { generarArchitecture } from './specs-templates/architecture';
import { generarProcess } from './specs-templates/process';
import { generarExecution } from './specs-templates/execution';
import { generarDesign } from './specs-templates/design';
import { generarValidationReport } from './specs-templates/validation-report';

export async function generarSpecsZIP(data: SpecsData): Promise<void> {
    const zip = new JSZip();
    const folder = zip.folder('specs')!;

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
