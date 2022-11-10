import * as vscode from 'vscode';
import { run as runConfigure } from './configure';
import { ShellCommandTaskProvider } from './shell-command';
import { run as runShellOutput } from './shell-output';

export function activate(context: vscode.ExtensionContext) {
  vscode.tasks.registerTaskProvider(ShellCommandTaskProvider.TaskType, new ShellCommandTaskProvider());
  const configure = vscode.commands.registerCommand('vsconfig.configure', runConfigure);
  const shellOutput = vscode.commands.registerCommand('vsconfig.shellOutput', runShellOutput);
  context.subscriptions.push(configure, shellOutput);
}

export function deactivate() {}
