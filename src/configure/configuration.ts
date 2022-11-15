import * as deepmerge from 'deepmerge';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { CancelError } from '../common/errors';
import { Template, getLaunchFile, getTasksFile } from './template';
import { Variables } from './variables';

enum WriteStrategy {
  Merge,
  Replace
}

export interface IArrayItem {
  [key: string]: any;
}

export class Configuration {
  constructor(private workspaceDir: string) {}

  static async create(): Promise<void> {
    const workspaceDir = await this.getWorkspaceDir();
    Variables.reset(workspaceDir);
    await new this(workspaceDir).execute();
    vscode.window.showInformationMessage(`Configured ${workspaceDir}`);
  }

  private async execute(): Promise<void> {
    const templates = await Template.getTemplates(await this.getTemplateDirs());

    if (!templates.length) {
      throw new Error('No templates found. Make sure you have launch.json/tasks.json in those folders');
    }

    const launchConfigs: object[] = [{ version: '0.2.0' }];
    const tasksConfigs: object[] = [{ version: '2.0.0' }];

    for (let template of templates) {
      const { launch, tasks } = await template.parse();
      launch && launchConfigs.push(launch);
      tasks && tasksConfigs.push(tasks);
    }

    const destTemplate = (await Template.getTemplates([this.getVSCodeDir()]))[0];

    if (destTemplate && (await this.getWriteStrategy()) == WriteStrategy.Merge) {
      const { launch, tasks } = await destTemplate.parse(false);
      launch && launchConfigs.splice(1, 0, launch);
      tasks && tasksConfigs.splice(1, 0, tasks);
    }

    const mergeOptions = { arrayMerge: Configuration.arrayMerge };
    await this.write(deepmerge.all(launchConfigs, mergeOptions), deepmerge.all(tasksConfigs, mergeOptions));
  }

  private async getTemplateDirs(): Promise<string[]> {
    const uris = await vscode.window.showOpenDialog({
      title: 'Template folders',
      openLabel: 'Select',
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: true
    });

    if (!uris) {
      throw new CancelError();
    }

    return uris.map((uri: vscode.Uri) => uri.fsPath);
  }

  private getVSCodeDir(): string {
    return getVSCodeDir(this.workspaceDir);
  }

  private async getWriteStrategy(): Promise<WriteStrategy> {
    const selection = await vscode.window.showQuickPick(['Merge', 'Replace'], {
      canPickMany: false,
      ignoreFocusOut: true,
      placeHolder: 'Target .vscode already contains config files. How do you want to write?'
    });

    if (!selection) {
      throw new CancelError();
    }

    return selection == 'Merge' ? WriteStrategy.Merge : WriteStrategy.Replace;
  }

  private async write(launchConfig: object, tasksConfig: object): Promise<void> {
    const vscodeDir = this.getVSCodeDir();
    await fs.promises.mkdir(vscodeDir, { recursive: true });
    await fs.promises.writeFile(getLaunchFile(vscodeDir), JSON.stringify(launchConfig, undefined, 4));
    await fs.promises.writeFile(getTasksFile(vscodeDir), JSON.stringify(tasksConfig, undefined, 4));
  }

  private static async getWorkspaceDir(): Promise<string> {
    const dirs = vscode.workspace.workspaceFolders || [];

    if (!dirs.length) {
      throw new Error('No workspace folder to configure');
    } else if (dirs.length == 1) {
      return dirs[0].uri.fsPath;
    }

    const dir = await vscode.window.showWorkspaceFolderPick({
      placeHolder: 'Workspace folder to configure',
      ignoreFocusOut: true
    });

    if (!dir) {
      throw new CancelError();
    }

    return dir.uri.fsPath;
  }

  private static arrayMerge(target: IArrayItem[], source: IArrayItem[]): IArrayItem[] {
    if (source.length) {
      target = [...target];
      const keys = Object.keys(source[0]);
      const key = ['name', 'label', 'id'].find((key: string) => keys.indexOf(key) != -1);

      if (key) {
        for (let sourceItem of source) {
          const index = target.findIndex((targetItem: IArrayItem) => {
            return targetItem && targetItem[key] && targetItem[key] == sourceItem[key];
          });

          if (index >= 0) {
            target[index] = sourceItem;
          } else {
            target.push(sourceItem);
          }
        }
      } else {
        target.push(...source);
      }
    }

    return target;
  }
}

export function getVSCodeDir(directory: string): string {
  return path.join(directory, '.vscode');
}
