import * as fs from 'fs-extra';

const debug = require('debug')('gh-health');

import {
  updateGithubData,
  fetchRepos,
  githubData,
  repoMeta,
  updateGithubTeams,
} from './data/cache-management';
import { loadRoots } from './data/roots';
import moment = require('moment');

async function main() {
  const argv = require('yargs')
    .option('org', { default: process.env.GH_ORG })
    // .command('update', 'fetch things from the internet', async )
    .option('update', {})
    .option('update-teams', {})
    .option('fetch', {})
    .option('roots', { nargs: 1 })
    .help().argv;

  const org: string = argv.org;

  if (argv.update) {
    await updateGithubData(org);
  }

  const ghDataIncludingArchived = await githubData(org);

  const ghData = ghDataIncludingArchived
    .filter((repo) => !repo.archived)
    // there's nothing in the repo meta for this that I can see; it's private, it's *not* a fork
    .filter((repo) => !repo.name.match(/-ghsa(:?-\w{4}){3}/));

  debug(
    `${ghDataIncludingArchived.length -
      ghData.length} archived repos hard removed`,
  );

  if (argv['update-teams']) {
    await updateGithubTeams(ghData);
  }

  if (argv.fetch) {
    await fetchRepos(ghData);
  }

  debug(`extracting info from ${ghData.length} repos`);
  let reposP = await repoMeta(ghData);

  const roots = await loadRoots(reposP, argv.roots);

  let repos = reposP.map((repoData) => {
    const { repo, info } = repoData;
    const lastPush = new Date(repo.pushed_at || repo.created_at);
    const rootOwnersEntry = (info.codeOwners || [])
      .filter((co) => co.pattern === '*')
      .map((co) => co.owners);
    const codeFiles = info.files.filter((f) =>
      f.path.match(/\.(?:jsx?|tsx?|vue|py|pl|php|java|cs|go|rb|rs|sh|swift)$/),
    ).length;

    if (rootOwnersEntry.length > 1) {
      throw new Error(`invalid CODEOWNERS: two * lines? (${repo.full_name})`);
    }

    const rootOwners = rootOwnersEntry.length ? rootOwnersEntry[0] : [];

    return {
      ...repoData,
      comp: {
        rootOwners,
        owners: rootOwners.length,
        lastPush,
        ageDays: moment().diff(moment(lastPush), 'days'),
        codeFiles,
      },
    };
  });

  const simpleRepos = [];
  for (const { repo, info, comp } of repos) {
    simpleRepos.push({
      name: repo.name,
      description: repo.description,
      rootOwners: comp.rootOwners,
      strongSet: roots.has(repo.name),
      isPublic: !repo.private,
      isFork: repo.fork,
      lastActivityDays: comp.ageDays,
      openIssues: repo.open_issues_count,
      codeFiles: comp.codeFiles,
      npmName: info.packageJson ? info.packageJson.name : null,
    });
  }

  await fs.writeFile('repos.json', JSON.stringify(simpleRepos));
}

main()
  .then(() => {})
  .catch((e) => console.log('main failed', e));
