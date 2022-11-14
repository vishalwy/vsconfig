import * as fs from 'fs';
import { parse } from 'jsonc-parser';

export async function lstat(entryPath: string): Promise<fs.Stats | undefined> {
  try {
    return await fs.promises.lstat(entryPath);
  } catch (error) {}
}

export async function readFile(file: string): Promise<string> {
  const buffer = await fs.promises.readFile(file);
  return buffer.toString('utf8');
}

export function parseJSON(input: string): any {
  return parse(input);
}
