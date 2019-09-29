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

  const org = argv.org;

  if (argv.update) {
    await updateGithubData(org);
  }

  if (argv.fetch) {
    await fetchRepos(org);
  }

  const ghData = await githubData(org);
  debug(`extracting info from ${ghData.length} repos`);
  let reposP = await repoMeta(ghData);

  const roots = await loadRoots(reposP, argv.roots);

  const quiteOldCutoff = moment()
    .subtract(2, 'months')
    .toDate();
  const veryOldCutoff = moment()
    .subtract(8, 'months')
    .toDate();

  let repos = reposP.map(({ repo, info }) => {
    const lastPush = new Date(repo.pushed_at || repo.created_at);
    const rootOwners = (info.codeOwners || [])
      .filter((co) => co.pattern === '*')
      .map((co) => co.owners);
    return {
      repo,
      info,
      comp: {
        rootOwners,
        owners: rootOwners.length,
        lastPush,
        quiteOld: lastPush < quiteOldCutoff,
        veryOld: lastPush < veryOldCutoff,
      },
    };
  });

  repos = _.sortBy(
    repos,
    ({ comp }) => comp.owners,
    ({ repo }) => roots.has(repo.name),
    ({ repo }) => !repo.private,
    ({ repo }) => !repo.fork,
    ({ comp }) => comp.quiteOld,
    ({ comp }) => comp.veryOld,
    ({ repo }) => repo.full_name,
  );

  for (const { repo, info, comp } of repos) {
    if (repo.archived) {
      continue;
    }

    const megaphone = '\u{1F4E2}';
    const fork = '\u{1F374}';
    const queen = '\u{1F478}';
    const treeRoot = '\u{1F332}';
    const veryOld = '\u{26B0}\u{FE0F} ';
    const quiteOld = '\u{1F474}';

    console.log(
      comp.owners ? queen : '  ',
      roots.has(repo.name) ? treeRoot : '  ',
      repo.private ? '  ' : megaphone,
      repo.fork ? fork : '  ',
      comp.veryOld ? veryOld : comp.quiteOld ? quiteOld : '  ',
      (repo.has_issues ? repo.open_issues_count : 0).toString().padStart(3),
      repo.name,
      info.packageJson ? `(nee ${info.packageJson.name})` : '',
      comp.owners ? comp.rootOwners : '',
    );
  }
}

main()
  .then(() => {})
  .catch((e) => console.log('main failed', e));
