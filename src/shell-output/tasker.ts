import * as vscode from 'vscode';
import { Deferred } from '../common/deferred';
import { CancelError } from '../common/errors';
import { ShellCommandTaskProvider } from '../shell-command';

export class Tasker {
  private splitRegex?: RegExp;
  constructor(private taskName: string, splitRegex?: string) {
    if (splitRegex) {
      this.splitRegex = new RegExp(splitRegex);
    }
  }

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
    let output = await deferredOutput.promise;
    return await this.pick(output);
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

  async pick(output: string): Promise<string> {
    if (!this.splitRegex) {
      return output;
    }

    const items = output.split(this.splitRegex).filter((item) => item);

    if (items.length <= 1) {
      return items.length ? items[0] : output;
    }

    const selectedItem = await vscode.window.showQuickPick(items);

    if (selectedItem) {
      return selectedItem;
    }

    throw new CancelError();
  }
}
