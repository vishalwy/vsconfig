import * as vscode from 'vscode';
import { Deferred } from '../common/deferred';
import { ShellCommandTaskProvider } from '../shell-command';

export class Tasker {
  constructor(private taskName: string) {}

  async execute(): Promise<string> {
    const deferredOutput = new Deferred<string>();
    const task = ShellCommandTaskProvider.resolve(await this.getTask(), deferredOutput);
    task.presentationOptions = {
      echo: false,
      showReuseMessage: false,
      panel: vscode.TaskPanelKind.Dedicated,
      clear: true
    };
    vscode.tasks.executeTask(task);
    return await deferredOutput.promise;
  }

  private async getTask(): Promise<vscode.Task> {
    const tasks = await vscode.tasks.fetchTasks({
      type: ShellCommandTaskProvider.TaskType
    });

    for (let task of tasks) {
      if (task.name == this.taskName) {
        return task;
      }
    }

    throw new Error(`${this.taskName} - Task not found`);
  }
}
