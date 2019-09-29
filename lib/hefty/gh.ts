import * as Octokit from '@octokit/rest';

const auth = process.env.GITHUB_PRIVATE_TEST_TOKEN;
const octokit = new Octokit({ auth });

export async function getRepos(org: string) {
  const repos = [];
  const requestRepos = octokit.repos.listForOrg.endpoint.merge({ org });
  for await (const page of octokit.paginate.iterator(requestRepos)) {
    for (const row of page.data) {
      repos.push(row);
    }
  }
  return repos;
}
