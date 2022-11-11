import * as deepmerge from 'deepmerge';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { Validator } from 'jsonschema';
import { CancelError } from '../common/errors';
import { getTemplates, getVSCodeDir, getLaunchFile, getTasksFile, ITemplate } from './template';
import { Variables, IConfigVariables } from './variables';
import { VariableSchema } from './variable-schema';

enum WriteStrategy {
  Merge,
  Replace
}

export class Configuration {
  async execute(): Promise<void> {
    const workspaceDir = await this.getWorkspaceDir();
    const templateDirs = await this.getTemplateDirs();
    const templates = await getTemplates(templateDirs);

    if (!templates.length) {
      throw new Error('No templates found. Make sure you have launch.json in those folders');
    }

    const variables = await this.getVariables(templates);
    const config = await this.interpolate(templates, variables);

    const vscodeDir = getVSCodeDir(workspaceDir);
    const destTemplates = await getTemplates([vscodeDir]);

    if (destTemplates.length && (await this.getWriteStrategy()) == WriteStrategy.Merge) {
      const destConfig = await this.interpolate(destTemplates);
      config.launchConfigs.push(...destConfig.launchConfigs);
      config.tasksConfigs.push(...destConfig.tasksConfigs);
    }

    await this.write(vscodeDir, deepmerge.all(config.launchConfigs), deepmerge.all(config.tasksConfigs));
    vscode.window.showInformationMessage(`Configured ${workspaceDir}`);
  }

  private async getWriteStrategy(): Promise<WriteStrategy> {
    const selection = await vscode.window.showQuickPick(['Merge', 'Replace'], {
      canPickMany: false,
      ignoreFocusOut: true,
      placeHolder: 'Target .vscode already has config files. How do you want to write?'
    });

    if (!selection) {
      throw new CancelError();
    }

    return selection == 'Merge' ? WriteStrategy.Merge : WriteStrategy.Replace;
  }

  private async getWorkspaceDir(): Promise<string> {
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

  private async getVariables(templates: ITemplate[]): Promise<Variables> {
    const variables = new Variables();
    const variablesConfigs = [];

    for (let { variablesFile } of templates) {
      if (!variablesFile) {
        continue;
      }

      const variablesConfig = JSON.parse(await variablesFile.getData());
      const validation = new Validator().validate(variablesConfig, VariableSchema);

      if (validation.errors.length) {
        throw new Error(`${variablesFile}: ${validation.errors[0].property} - ${validation.errors[0].message}`);
      }

      variablesConfigs.push(variablesConfig);
    }

    if (!variablesConfigs.length) {
      return variables;
    }

    const variablesConfig = <IConfigVariables>deepmerge.all(variablesConfigs);
    await variables.load(variablesConfig);
    return variables;
  }

  private async interpolate(
    templates: ITemplate[],
    variables?: Variables
  ): Promise<{ launchConfigs: object[]; tasksConfigs: object[] }> {
    const launchConfigs = [];
    const tasksConfigs = [];

    for (let { launchFile, tasksFile } of templates) {
      const data = await launchFile.getData();
      launchConfigs.push(JSON.parse(variables?.eval(data) || data));

      if (tasksFile) {
        const data = await tasksFile.getData();
        tasksConfigs.push(JSON.parse(variables?.eval(data) || data));
      }
    }

    return { launchConfigs, tasksConfigs };
  }

  private async write(vscodeDir: string, launchConfig: object, tasksConfig: object): Promise<void> {
    await fs.promises.mkdir(vscodeDir, { recursive: true });
    await fs.promises.writeFile(getLaunchFile(vscodeDir), JSON.stringify(launchConfig, undefined, 4));
    await fs.promises.writeFile(getTasksFile(vscodeDir), JSON.stringify(tasksConfig, undefined, 4));
  }
}
