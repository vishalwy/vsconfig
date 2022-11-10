import * as vscode from 'vscode';
import { spawn, SpawnOptions } from 'child_process';
import { homedir } from 'os';

export class ShellCommandTaskTerminal implements vscode.Pseudoterminal {
  private writeEmitter = new vscode.EventEmitter<string>();
  private closeEmitter = new vscode.EventEmitter<number>();
  onDidWrite: vscode.Event<string> = this.writeEmitter.event;
  onDidClose: vscode.Event<number> = this.closeEmitter.event;

  constructor(private command: string, private timeout?: number, private outputFunc?: (output: string) => void) {}

  async open(initialDimensions: vscode.TerminalDimensions | undefined): Promise<void> {
    try {
      const output = await this.execute();

      if (this.outputFunc) {
        this.outputFunc(output);
      } else {
        this.writeEmitter.fire(output);
      }

      this.closeEmitter.fire(0);
    } catch (code: any) {
      this.closeEmitter.fire(code);
    }
  }

  close(): void {}

  private async execute(): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = '';
      const options: SpawnOptions = {
        shell: true,
        cwd: homedir(),
        timeout: this.timeout
      };
      const process = spawn(this.command, [], options);
      process.stdout?.on('data', (data) => (output += data));
      process.on('error', (error) => reject(error));

      process.on('close', (code) => {
        if (!code) {
          resolve(output);
        } else {
          reject(new Error(`${this.command} terminated with status code ${code}`));
        }
      });
    });
  }
}
