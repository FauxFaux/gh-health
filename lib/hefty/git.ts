import { spawn } from 'child_process';
import * as fs from 'fs-extra';

const debug = require('debug')('hefty/git');

async function callGit(cwd: string, command: string[]): Promise<string> {
  const child = spawn('/usr/bin/git', command, {
    stdio: ['ignore', 'pipe', 'inherit'],
    cwd,
  });

  let buf = '';
  for await (const chunk of child.stdout) {
    const text = (chunk as Buffer).toString('utf-8');
    buf += text;
  }

  return new Promise((resolve, reject) => {
    child.once('exit', (code) => {
      if (0 === code) {
        resolve(buf);
      } else {
        reject(`exit code: ${code} running ${command} in ${cwd}`);
      }
    });
    child.once('error', (err) => reject(err));
  });
}

export async function ensureRepo(path: string, cloneUrl: string) {
  if (!fs.existsSync(path)) {
    debug(`cloning missing ${cloneUrl} to ${path}`);
    await gitClone(cloneUrl, path);
  } else {
    debug(`fetching ${path}`);
    await gitRemoteUpdate(path);
  }
}

export async function gitClone(url: string, dest: string): Promise<void> {
  await callGit('/', ['clone', '--quiet', url, dest]);
}

export async function gitRemoteUpdate(cwd: string): Promise<void> {
  await callGit(cwd, ['remote', 'update', '--prune']);
}

export async function gitIsEmpty(cwd: string): Promise<boolean> {
  const output = await callGit(cwd, ['rev-list', '-n', '1', '--all']);
  return output.trim() === '';
}

export interface IGitFile {
  mode: number;
  type: ObjectType;
  hash: string;
  path: string;
}

export async function gitLsTree(cwd: string, ref: string): Promise<IGitFile[]> {
  const output = await callGit(cwd, ['ls-tree', ref]);
  const ret: IGitFile[] = [];

  for (const line of output.split('\n')) {
    if (!line) {
      continue;
    }
    const [, mode, type, hash, path] = line.match(/^(\d+) (\w+) (\w+)\t(.*)$/)!;
    if (!isObjectType(type)) {
      throw new Error(`unrecognised object type: ${type}`);
    }
    // ho ho ho, radix: 10.
    ret.push({ mode: parseInt(mode, 10), type, hash, path });
  }

  return ret;
}

type ObjectType = 'blob' | 'tree' | 'commit';

export function isObjectType(type: string): type is ObjectType {
  return ['blob', 'commit', 'tree'].includes(type);
}

export async function gitCatBlob(
  cwd: string,
  ref: string,
  path: string,
): Promise<string> {
  return callGit(cwd, ['cat-file', 'blob', `${ref}:${path}`]);
}
