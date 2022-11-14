import * as fs from 'fs';
import * as path from 'path';
import { lstat, readFile } from './utils';

export class FSEntry {
  readonly path: string;

  constructor(path: string) {
    this.path = path;
  }

  async lstat(): Promise<fs.Stats | undefined> {
    return lstat(this.path);
  }
}

export class Directory extends FSEntry {
  async getEntries(): Promise<FSEntry[]> {
    return (await fs.promises.readdir(this.path)).map((entry) => new FSEntry(path.join(this.path, entry)));
  }
}

export class File extends FSEntry {
  private fileData?: string;

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

  async getDataSafe(): Promise<string | undefined> {
    if ((await this.lstat())?.isFile()) {
      return this.getData();
    }
  }
}
