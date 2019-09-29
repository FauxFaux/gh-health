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
  const repos = await repoMeta(ghData);
  for (const { repo, info } of repos) {
    if (repo.archived) {
      continue;
    }

    console.log(
      repo.name,
      repo.fork,
      info.rootFiles.length,
      info.packageJson ? info.packageJson.name : 'n/a',
      (info.codeOwners || [])
        .filter((co) => co.pattern === '*')
        .map((co) => co.owners),
    );
  }
}

main()
  .then(() => {})
  .catch((e) => console.log('main failed', e));
