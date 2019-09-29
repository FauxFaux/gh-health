import * as _ from 'lodash';
const debug = require('debug')('gh-health');

import {
  updateGithubData,
  fetchRepos,
  githubData,
  repoMeta,
} from './data/cache-management';

async function main() {
  const argv = require('yargs')
    .option('org', { default: process.env.GH_ORG })
    // .command('update', 'fetch things from the internet', async )
    .option('update', {})
    .option('fetch', {})
    .help().argv;

  const org = argv.org;

  if (argv.update) {
    await updateGithubData(org);
  }

  if (argv.fetch) {
    await fetchRepos(org);
  }

  const ghData = await githubData(org);
  debug(`extracting info from ${ghData.length} repos`);
  let repos = await repoMeta(ghData);
  repos = _.sortBy(
    repos,
    ({ info }) =>
      (info.codeOwners || []).filter((co) => co.pattern === '*').length,
    ({ repo }) => !repo.private,
    ({ repo }) => !repo.fork,
    ({ repo }) => repo.full_name,
  );
  for (const { repo, info } of repos) {
    if (repo.archived) {
      continue;
    }

    const megaphone = '\u{1F4E2}';
    const fork = '\u{1F374}';
    const queen = '\u{1F478}';

    const owners = (info.codeOwners || [])
      .filter((co) => co.pattern === '*')
      .map((co) => co.owners);

    console.log(
      owners.length ? queen : '  ',
      repo.private ? '  ' : megaphone,
      repo.fork ? fork : '  ',
      repo.name,
      '(' + (info.packageJson ? info.packageJson.name : 'n/a') + ')',
      owners,
    );
  }
}

main()
  .then(() => {})
  .catch((e) => console.log('main failed', e));