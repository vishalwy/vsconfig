import * as path from 'path';
import * as vscode from 'vscode';
import { CancelError } from '../common/errors';
import { Directory, File } from '../common/file-system';
import { Variables } from './variables';
import { parseJSON } from '../common/utils';

export interface IConfig {
  launch?: object;
  tasks?: object;
}

export class Template {
  private launch?: string;
  private tasks?: string;
  private variables?: string;

  constructor(private directory: string) {
    this.directory = directory;
  }

  async parse(interpolate: boolean = true): Promise<IConfig> {
    const { launch = this.launch, tasks = this.tasks } = interpolate ? await this.interpolate() : {};
    return {
      launch: launch && parseJSON(launch),
      tasks: tasks && parseJSON(tasks)
    };
  }

  static async getTemplates(dirs: string[]): Promise<Template[]> {
    const templates = [];

    for (let dir of await this.selectDirectories(dirs)) {
      const template = new Template(dir);
      await template.load();

      if (template.launch || template.tasks) {
        templates.push(template);
      }
    }

    return templates;
  }

  private async interpolate(): Promise<{ launch?: string; tasks?: string }> {
    const variables = new Variables(this.variables && parseJSON(this.variables));
    const launch = this.launch && (await variables.eval(this.launch));
    const tasks = this.tasks && (await variables.eval(this.tasks));
    return { launch, tasks };
  }

  private async load(): Promise<void> {
    this.launch = await new File(getLaunchFile(this.directory)).getDataSafe();
    this.tasks = await new File(getTasksFile(this.directory)).getDataSafe();
    this.variables = await new File(getVariablesFile(this.directory)).getDataSafe();
  }

  private static async selectDirectories(dirs: string[]) {
    if (dirs.length != 1) {
      return dirs;
    }

    const directory = new Directory(dirs[0]);
    const directoryNames = [];

    if (!(await new File(getTemplateFile(directory.path)).lstat())?.isFile()) {
      return dirs;
    }

    for (let entry of await directory.getEntries()) {
      if ((await entry.lstat())?.isDirectory()) {
        directoryNames.push(path.basename(entry.path));
      }
    }

    const selectedDirs = await vscode.window.showQuickPick(directoryNames, {
      canPickMany: true,
      ignoreFocusOut: true,
      placeHolder: 'Select templates'
    });

    if (!selectedDirs) {
      throw new CancelError();
    }

    return selectedDirs.map((dir) => path.join(directory.path, dir));
  }
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

export function getTemplateFile(directory: string): string {
  return path.join(directory, 'template.vsconfig.json');
}
