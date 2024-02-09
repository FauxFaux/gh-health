import * as fs from 'fs-extra';
import * as os from 'os';

import pMap from 'p-map';

import { getRepos, getTeams } from '../hefty/gh';
import { repoBarePath, reposJson, repoTeamJson } from './cache-paths';
import { IRepo, ITeam } from './gh-org-repos';
import { ensureRepo } from '../hefty/git';
import { IRepoInfo, repoInfo } from '../hefty/repo-info';

const concurrency = os.cpus().length;

export async function updateGithubData(org: string) {
  const repos = await getRepos(org);
  await fs.writeFile(reposJson(org), JSON.stringify(repos));
}

export async function updateGithubTeams(repos: IRepo[]) {
  await pMap(
    repos,
    async (repo) => {
      const owner = repo.owner.login;
      const teams = await getTeams(owner, repo.name);
      await fs.writeFile(repoTeamJson(owner, repo.name), JSON.stringify(teams));
    },
    { concurrency },
  );
}

async function loadJson(path: string): Promise<any> {
  let buffer = await fs.readFile(path);
  return JSON.parse(buffer.toString('utf-8'));
}

export async function githubData(org: string): Promise<IRepo[]> {
  return await loadJson(reposJson(org));
}

export async function githubTeams(
  owner: string,
  repo: string,
): Promise<ITeam[]> {
  return await loadJson(repoTeamJson(owner, repo));
}

interface IFetchyRepo {
  full_name: string;
  ssh_url: string;
}

export async function fetchRepos(repos: IFetchyRepo[]) {
  await pMap(
    repos,
    async (repo) => {
      await ensureRepo(repoBarePath(repo.full_name), repo.ssh_url);
    },
    { concurrency },
  );
}

export async function repoMeta(
  repos: IRepo[],
): Promise<Array<{ repo: IRepo; info: IRepoInfo; teams: ITeam[] }>> {
  return await pMap(
    repos,
    async (repo) => ({
      repo,
      info: await repoInfo(repoBarePath(repo.full_name)),
      teams: await githubTeams(repo.owner.login, repo.name),
    }),
    { concurrency: 1 },
  );
}
