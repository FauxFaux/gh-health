import * as Octokit from '@octokit/rest';

const auth = process.env.GITHUB_PRIVATE_TEST_TOKEN;
const octokit = new Octokit({ auth });

async function pageThrough(req: Octokit.RequestOptions): Promise<object[]> {
  const repos = [];
  for await (const page of octokit.paginate.iterator(req)) {
    for (const row of page.data) {
      repos.push(row);
    }
  }
  return repos;
}

export async function getRepos(org: string): Promise<object[]> {
  return pageThrough(octokit.repos.listForOrg.endpoint.merge({ org }));
}

export async function getTeams(owner: string, repo: string): Promise<object[]> {
  return pageThrough(octokit.repos.listTeams.endpoint.merge({ owner, repo }));
}
