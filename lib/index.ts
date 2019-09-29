import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

import cachedir = require('cachedir');
import * as pMap from 'p-map';
const debug = require('debug')('gh-health');

import { getRepos } from './gh';
import { gitClone, gitRemoteUpdate } from './git';

const concurrency = os.cpus().length;
const cacheDir = cachedir('gh-health');

function reposJson(org: string): string {
  return path.join(cacheDir, `repos-${org}.json`);
}

function repoBarePath(fullName: string): string {
  return path.join(cacheDir, 'repos', `${fullName}.git`);
}

async function update(org: string) {
  const repos = await getRepos(org);
  await fs.writeFile(reposJson(org), JSON.stringify(repos));
}

// 2019-05-21T16:18:25Z
type IsoDate = string;

interface IRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: unknown;
  description: string;
  fork: boolean;

  ssh_url: string;

  created_at: IsoDate;
  updated_at: IsoDate;
  pushed_at: IsoDate;

  // ??
  size: number;

  stargazers_count: number;
  watchers_count: number;

  has_issues: boolean;
  open_issues_count: number;
  open_issues: number;
  forks_count: number;

  archived: boolean;
  disabled: boolean;

  // master
  default_branch: string;

  permissions: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

async function loadRepos(org: string): Promise<IRepo[]> {
  let buffer = await fs.readFile(reposJson(org));
  return JSON.parse(buffer.toString('utf-8'));
}

async function fetch(org: string) {
  const repos = await loadRepos(org);
  await pMap(
    repos,
    async (repo) => {
      const path = repoBarePath(repo.full_name);
      if (!fs.existsSync(path)) {
        debug(`cloning missing ${repo.ssh_url} to ${path}`);
        await gitClone(repo.ssh_url, path);
      } else {
        debug(`fetching ${path}`);
        await gitRemoteUpdate(path);
      }
    },
    { concurrency },
  );
}

async function main() {
  const argv = require('yargs')
    .option('org', { default: process.env.GH_ORG })
    // .command('update', 'fetch things from the internet', async )
    .option('update', {})
    .option('fetch', {})
    .help().argv;

  const org = argv.org;

  if (argv.update) {
    await update(org);
  }

  if (argv.fetch) {
    await fetch(org);
  }
}

main()
  .then(() => {})
  .catch((e) => console.log('main failed', e));
