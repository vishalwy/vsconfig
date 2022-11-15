import * as crypto from 'crypto';
import * as mustache from 'mustache';
import * as vscode from 'vscode';
import { CancelError } from '../common/errors';
import { Validator } from 'jsonschema';
import { VariableSchema } from './variable-schema';

const HASHID_REGEX = /{{\s*(HASHID\([^\)]+\))\s*}}/g;
const NONSTRING_REGEX = /"{{\s*NONSTRING\(([^\)]+)\)\s*}}"/g;

export interface IConfigVariableDetails {
  description?: string;
  values?: string[];
  optional?: boolean;
}

export interface IConfigVariables {
  [variableName: string]: IConfigVariableDetails;
}

export class Variables {
  private static scope: string = '';
  private static values: { [variableName: string]: string } = {};

  constructor(private config: IConfigVariables = {}) {
    const validation = new Validator().validate(config, VariableSchema);

    if (validation.errors.length) {
      throw new Error(`${validation.errors[0].property} - ${validation.errors[0].message}`);
    }
  }

  async eval(input: string): Promise<string> {
    input = this.replaceHashIds(input);
    input = this.replaceNumbers(input);
    return await this.replaceVariables(input);
  }

  static reset(scope: string): void {
    this.scope = scope;
    this.values = {};
  }

  private async replaceVariables(input: string): Promise<string> {
    const values: { [variableName: string]: string } = {};

    for (let [variable, details] of Object.entries(this.config)) {
      let value = Variables.values[variable] || (await this.readVariable(variable, details));
      Variables.values[variable] = values[variable] = value;
    }

    if (!Object.keys(values).length) {
      return input;
    }

    return mustache.render(input, values, undefined, {
      escape: (text: string) => JSON.stringify(text).replace(/(^")|("$)/g, '')
    });
  }

  private replaceHashIds(input: string): string {
    return input.replace(HASHID_REGEX, (_, p1: string) => {
      const data = `${Variables.scope}:${p1}`;
      return crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
    });
  }

  private replaceNumbers(input: string): string {
    return input.replace(NONSTRING_REGEX, (_, p1: string) => {
      return `{{${p1}}}`;
    });
  }

  private async readVariable(variable: string, details: IConfigVariableDetails): Promise<string> {
    const { description = variable, values = [], optional = false } = details;
    let value = undefined;

    if (values.length > 1) {
      value = await vscode.window.showQuickPick(values, {
        placeHolder: description,
        ignoreFocusOut: true,
        canPickMany: false
      });
    } else {
      value = await vscode.window.showInputBox({
        prompt: description,
        ignoreFocusOut: true,
        value: values.length ? values[0] : '',
        validateInput: (value) => {
          if (!optional && (!value || !value.trim())) {
            return 'Value cannot be empty or contain only whitespaces';
          }

          return '';
        }
      });
    }

    if (value == undefined) {
      throw new CancelError();
    }

    return value;
  }
}
