import * as vscode from 'vscode';
import { run as runConfigure } from './configure';
import { ShellCommandTaskProvider } from './shell-command';
import { run as runShellOutput } from './shell-output';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.tasks.registerTaskProvider(ShellCommandTaskProvider.TaskType, new ShellCommandTaskProvider()),
    vscode.commands.registerCommand('vsconfig.configure', runConfigure),
    vscode.commands.registerCommand('vsconfig.shellOutput', runShellOutput)
  );
}

export function deactivate(): void {}
