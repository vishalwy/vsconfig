import * as fs from 'fs';
import { lstat, readFile } from './utils';

export class File {
  private readonly path: string;
  private fileData?: string;

  constructor(path: string) {
    this.path = path;
  }

  async lstat(): Promise<fs.Stats | undefined> {
    return lstat(this.path);
  }

  async getData(): Promise<string> {
    try {
      if (!this.fileData) {
        this.fileData = await readFile(this.path);
      }

      return this.fileData;
    } catch (error: any) {
      throw Error(`${this.path} - ${error.message}`);
    }
  }
}
