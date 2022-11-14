import * as vscode from 'vscode';
import { Deferred } from '../common/deferred';
import { ShellCommandTaskTerminal } from './terminal';

interface IShellCommandTaskDefinition extends vscode.TaskDefinition {
  command: string;
  timeout?: number;
}

export class ShellCommandTaskProvider implements vscode.TaskProvider {
  static TaskType = 'shell-command';

  async provideTasks(): Promise<vscode.Task[]> {
    return [];
  }

  resolveTask(task: vscode.Task): vscode.Task | undefined {
    return ShellCommandTaskProvider.resolve(task);
  }

  static resolve(sourceTask: vscode.Task, deferredOutput?: Deferred<string>): vscode.Task {
    const definition = <IShellCommandTaskDefinition>sourceTask.definition;

    const execution = new vscode.CustomExecution(
      async (taskDefinition: vscode.TaskDefinition): Promise<vscode.Pseudoterminal> => {
        const definition = <IShellCommandTaskDefinition>taskDefinition;
        let output = '';
        const terminal = new ShellCommandTaskTerminal(
          definition.command,
          definition.timeout,
          deferredOutput ? (data: string) => (output = data) : undefined
        );

        terminal.onDidClose((code) => {
          if (deferredOutput) {
            if (code) {
              deferredOutput.reject(new Error(`Command terminated with status code ${code}`));
            } else {
              deferredOutput.resolve(output);
            }
          }
        });

        return terminal;
      }
    );

    return new vscode.Task(
      definition,
      sourceTask.scope || vscode.TaskScope.Workspace,
      sourceTask.name,
      sourceTask.source,
      execution
    );
  }
}
