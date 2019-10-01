import * as _ from 'lodash';

const debug = require('debug')('gh-health');

import {
  updateGithubData,
  fetchRepos,
  githubData,
  repoMeta,
} from './data/cache-management';
import { loadRoots } from './data/roots';
import moment = require('moment');

async function main() {
  const argv = require('yargs')
    .option('org', { default: process.env.GH_ORG })
    // .command('update', 'fetch things from the internet', async )
    .option('update', {})
    .option('fetch', {})
    .option('roots', { nargs: 1 })
    .help().argv;

  const org: string = argv.org;

  if (argv.update) {
    await updateGithubData(org);
  }

  const ghDataIncludingArchived = await githubData(org);

  const ghData = ghDataIncludingArchived.filter((repo) => !repo.archived);

  debug(
    `${ghDataIncludingArchived.length -
      ghData.length} archived repos hard removed`,
  );

  if (argv.fetch) {
    await fetchRepos(ghData);
  }

  debug(`extracting info from ${ghData.length} repos`);
  let reposP = await repoMeta(ghData);

  const roots = await loadRoots(reposP, argv.roots);

  let repos = reposP.map(({ repo, info }) => {
    const lastPush = new Date(repo.pushed_at || repo.created_at);
    const rootOwners = (info.codeOwners || [])
      .filter((co) => co.pattern === '*')
      .map((co) => co.owners);
    const codeFiles = info.files.filter((f) =>
      f.path.match(/\.(?:jsx?|tsx?|vue|py|pl|php|java|cs|go|rb|rs|sh|swift)$/),
    ).length;

    return {
      repo,
      info,
      comp: {
        rootOwners,
        owners: rootOwners.length,
        lastPush,
        ageDays: moment().diff(moment(lastPush), 'days'),
        codeFiles,
      },
    };
  });

  for (const { repo, info, comp } of repos) {
    console.log([
      comp.owners ? comp.rootOwners.join(' ') : '',
      roots.has(repo.name),
      !repo.private,
      repo.fork,
      comp.ageDays,
      repo.open_issues_count,
      comp.codeFiles,
      repo.name,
      info.packageJson ? info.packageJson.name : '',
      repo.description,
    ].join('\t'));
  }
}

main()
  .then(() => {})
  .catch((e) => console.log('main failed', e));
