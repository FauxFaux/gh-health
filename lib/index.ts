// const debug = require('debug')('gh-health');

import {updateGithubData, fetchRepos, githubData} from './data/cache-management';

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
}

main()
  .then(() => {})
  .catch((e) => console.log('main failed', e));
