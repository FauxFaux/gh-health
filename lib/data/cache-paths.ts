import * as path from 'path';
import * as fs from 'fs-extra';

import cachedir = require('cachedir');

const cacheDir = cachedir('gh-health');
fs.mkdirpSync(cacheDir);

export function reposJson(org: string): string {
  return path.join(cacheDir, `repos-${org}.json`);
}

export function repoTeamJson(owner: string, repo: string): string {
  const dir = path.join(cacheDir, owner);
  fs.mkdirpSync(dir);
  return path.join(dir, `teams-${repo}.json`);
}

export function repoBarePath(fullName: string): string {
  return path.join(cacheDir, 'repos', `${fullName}.git`);
}
