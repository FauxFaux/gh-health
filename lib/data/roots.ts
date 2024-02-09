import * as fs from 'node:fs/promises';
import * as _ from 'lodash';

import { IRepo } from './gh-org-repos';
import { IRepoInfo } from '../hefty/repo-info';

const debug = require('debug')('roots');

export async function loadRoots(
  repos: Array<{ repo: IRepo; info: IRepoInfo }>,
  path: string,
) {
  // jq 'map(.name)' <e/sd.json > e/roots.json
  const roots = new Set<string>(
    JSON.parse((await fs.readFile(path)).toString('utf-8')),
  );

  const nameToRepo = new Map();

  for (const { repo, info } of repos) {
    if (!info.packageJson) {
      continue;
    }
    nameToRepo.set(info.packageJson.name, repo.name);
  }

  debug(`before: ${roots.size}`);

  while (true) {
    const start = roots.size;

    for (const { repo, info } of _.sortBy(repos, ({ repo }) => repo.name)) {
      if (repo.archived) {
        continue;
      }

      if (!roots.has(repo.name)) {
        continue;
      }

      if (!info.packageJson) {
        continue;
      }

      for (const dep of Object.keys(info.packageJson.dependencies || {})) {
        const newRepo = nameToRepo.get(dep);
        if (newRepo && !roots.has(newRepo)) {
          debug(
            `discovered: '${repo.name}' depends on '${dep}', which is in '${newRepo}'`,
          );
          roots.add(newRepo);
        }
      }
    }

    if (start === roots.size) {
      debug(`done, now: ${roots.size}`);
      break;
    }

    debug("let's try that one again!");
  }

  return roots;
}
