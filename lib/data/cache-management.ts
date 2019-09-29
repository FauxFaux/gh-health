import * as fs from 'fs-extra';
import * as os from 'os';

import * as pMap from 'p-map';

import { getRepos } from '../hefty/gh';
import { repoBarePath, reposJson } from './cache-paths';
import { IRepo } from './gh-org-repos';
import { ensureRepo } from '../hefty/git';

const concurrency = os.cpus().length;

export async function updateGithubData(org: string) {
  const repos = await getRepos(org);
  await fs.writeFile(reposJson(org), JSON.stringify(repos));
}

export async function githubData(org: string): Promise<IRepo[]> {
  let buffer = await fs.readFile(reposJson(org));
  return JSON.parse(buffer.toString('utf-8'));
}

export async function fetchRepos(org: string) {
  const repos = await githubData(org);
  await pMap(
    repos,
    async (repo) => {
      await ensureRepo(repoBarePath(repo.full_name), repo.ssh_url);
    },
    { concurrency },
  );
}
