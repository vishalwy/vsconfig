import * as vscode from 'vscode';
import { CancelError } from '../common/errors';
import { Configuration } from './configuration';

export async function run(): Promise<void> {
  try {
    await new Configuration().execute();
  } catch (error: any) {
    if (!(error instanceof CancelError)) {
      vscode.window.showErrorMessage(`Error configuring .vscode; ${error.message}`);
    }
  }
}
