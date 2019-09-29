import * as path from 'path';
import cachedir = require('cachedir');

const cacheDir = cachedir('gh-health');

export function reposJson(org: string): string {
  return path.join(cacheDir, `repos-${org}.json`);
}

export function repoBarePath(fullName: string): string {
  return path.join(cacheDir, 'repos', `${fullName}.git`);
}
