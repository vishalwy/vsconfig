import * as mustache from 'mustache';
import * as vscode from 'vscode';
import { v4 as uuid } from 'uuid';
import { CancelError } from '../common/errors';

const UUID_REGEX = /{{\s*(UUID\([^\)]+\))\s*}}/g;
const NUMBER_REGEX = /"{{\s*NUMBER\(([^\)]+)\)\s*}}"/g;

export interface IConfigVariableDetails {
  description?: string;
  values?: string[];
  required?: boolean;
}

export interface IConfigVariables {
  [variableName: string]: IConfigVariableDetails;
}

export class Variables {
  private variables: { [variableName: string]: string } = {};
  private uuids: { [variableName: string]: string } = {};

  async load(config: IConfigVariables): Promise<void> {
    for (let [variable, details] of Object.entries(config)) {
      let value = await this.readVariable(variable, details);

      if (typeof value == 'undefined') {
        throw new CancelError();
      }

      this.variables[variable] = value;
    }
  }

  eval(input: string): string {
    input = this.replaceUUID(input);
    input = this.replaceNUMBER(input);

    if (!Object.keys(this.variables)) {
      return input;
    }

    return mustache.render(input, this.variables, undefined, {
      escape: (text: string) => JSON.stringify(text).replace(/(^")|("$)/g, '')
    });
  }

  private replaceUUID(input: string): string {
    return input.replace(UUID_REGEX, (_, p1: string) => {
      let id = this.uuids[p1];

      if (!id) {
        this.uuids[p1] = id = uuid();
      }

      return id;
    });
  }

  private replaceNUMBER(input: string): string {
    return input.replace(NUMBER_REGEX, (_, p1: string) => {
      return `{{${p1}}}`;
    });
  }

  private readVariable(variable: string, details: IConfigVariableDetails): Thenable<string | undefined> {
    const { description = variable, values = [], required = true } = details;

    if (values.length > 1) {
      return vscode.window.showQuickPick(values, {
        placeHolder: description,
        ignoreFocusOut: true,
        canPickMany: false
      });
    }

    return vscode.window.showInputBox({
      prompt: description,
      ignoreFocusOut: true,
      value: values.length ? values[0] : '',
      validateInput: (value) => {
        if (required && (!value || !value.trim())) {
          return 'Value cannot be empty or contain only whitespaces';
        }

        return '';
      }
    });
  }
}
