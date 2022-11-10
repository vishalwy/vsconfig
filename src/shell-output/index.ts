import * as vscode from 'vscode';
import { CancelError } from '../common/errors';
import { Tasker } from './tasker';

export async function run(taskName: string): Promise<string | undefined> {
  try {
    if (!taskName) {
      throw new Error('No task name specified');
    }

    return await new Tasker(taskName).execute();
  } catch (error: any) {
    if (!(error instanceof CancelError)) {
      vscode.window.showErrorMessage(`Error exeecuting '${taskName}'; ${error.message}`);
    }
  }
}
