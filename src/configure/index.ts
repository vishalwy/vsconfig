import * as vscode from 'vscode';
import { CancelError } from '../common/errors';
import { Configuration } from './configuration';

export async function run(): Promise<void> {
  try {
    await Configuration.create();
  } catch (error: any) {
    if (!(error instanceof CancelError)) {
      vscode.window.showErrorMessage(`Error configuring .vscode; ${error.message}`);
    }
  }
}
