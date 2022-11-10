import * as vscode from 'vscode';
import { CancelError } from '../common/errors';
import { Tasker } from './tasker';

interface IRunArgs {
  taskName: string;
  splitRegex?: string;
}

export async function run(args: IRunArgs): Promise<string | undefined> {
  try {
    if (!args.taskName) {
      throw new Error('No task name specified');
    }

    return await new Tasker(args.taskName, args.splitRegex).execute();
  } catch (error: any) {
    if (!(error instanceof CancelError)) {
      const taskName = args?.taskName || 'Unknown Task';
      vscode.window.showErrorMessage(`Error exeecuting '${taskName}'; ${error.message}`);
    }
  }
}
