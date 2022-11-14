import * as vscode from 'vscode';
import { CancelError } from '../common/errors';
import { Tasker } from './tasker';

interface IRunArgs {
  taskName: string;
  splitRegex?: string;
}

export async function run(args: IRunArgs): Promise<string | void> {
  try {
    if (!args.taskName) {
      throw new Error('No task name specified');
    }

    return await new Tasker(args.taskName, args.splitRegex).execute();
  } catch (error: any) {
    if (!(error instanceof CancelError)) {
      vscode.window.showErrorMessage(`Error executing '${args?.taskName}'; ${error.message}`);
    }
  }
}
