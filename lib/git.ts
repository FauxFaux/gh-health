import { spawn } from 'child_process';

async function callGit(cwd: string, command: string[]): Promise<string> {
  const child = spawn('/usr/bin/git', command, {
    stdio: ['ignore', 'pipe', 'inherit'],
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
        reject(`exit code: ${code}`);
      }
    });
    child.once('error', (err) => reject(err));
  });
}

export async function gitClone(url: string, dest: string): Promise<void> {
  await callGit('.', ['clone', '--quiet', url, dest]);
}

export async function gitRemoteUpdate(cwd: string): Promise<void> {
  await callGit(cwd, ['remote', 'update', '--prune']);
}
