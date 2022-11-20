import * as vscode from 'vscode';
import { CancelError } from '../common/errors';
import { Tasker, ISplitOptions } from './tasker';

interface IRunArgs {
  taskName: string;
  split?: {
    regex: string;
    prompt?: string;
  };
}

export async function run(args: IRunArgs): Promise<string | void> {
  try {
    if (!args.taskName) {
      throw new Error("Argument should contain a 'taskName'");
    }

    let splitOptions: ISplitOptions | undefined = undefined;
    let splitArgs = args.split;

    if (splitArgs) {
      if (!splitArgs.regex) {
        throw new Error("Argument 'split' should contain a 'regex'");
      }

      splitOptions = { regex: new RegExp(splitArgs.regex), prompt: splitArgs.prompt };
    }

    return await new Tasker(args.taskName, splitOptions).execute();
  } catch (error: any) {
    if (!(error instanceof CancelError)) {
      vscode.window.showErrorMessage(`Error executing '${args?.taskName}'; ${error.message}`);
    }
  }
}
