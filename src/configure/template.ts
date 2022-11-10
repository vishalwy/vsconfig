import * as path from 'path';
import { File } from '../common/file';

export interface ITemplate {
  launchFile: File;
  tasksFile?: File;
  variablesFile?: File;
}

export async function getTemplates(dirs: string[]): Promise<ITemplate[]> {
  const templates = [];

  for (let templateDir of dirs) {
    const launchFile = new File(getLaunchFile(templateDir));

    if ((await launchFile.lstat())?.isFile()) {
      const tasksFile = new File(getTasksFile(templateDir));
      const variablesFile = new File(getVariablesFile(templateDir));
      const template: ITemplate = {
        launchFile,
        tasksFile: (await tasksFile.lstat())?.isFile() ? tasksFile : undefined,
        variablesFile: (await variablesFile.lstat())?.isFile() ? variablesFile : undefined
      };
      templates.push(template);
    }
  }

  return templates;
}

export function getLaunchFile(directory: string): string {
  return path.join(directory, 'launch.json');
}

export function getTasksFile(directory: string): string {
  return path.join(directory, 'tasks.json');
}

export function getVariablesFile(directory: string): string {
  return path.join(directory, 'variables.vsconfig.json');
}

export function getVSCodeDir(directory: string): string {
  return path.join(directory, '.vscode');
}
