import { gitCatBlob, gitIsEmpty, gitLsTree, IGitFile } from './git';
import { parse, CodeOwnersEntry } from 'codeowners-utils';

export interface IPackageJson {
  name: string;
  version: string;
  description: string;
  author: string;
  license: string;
  dependencies: { [name: string]: string };
  devDependencies: { [name: string]: string };
}

export interface IPipFile {}

export interface IRepoInfo {
  files: IGitFile[];
  codeOwners?: CodeOwnersEntry[];
  packageJson?: IPackageJson;
  packageLockJson?: unknown;
  pipfile?: IPipFile;
}

export async function repoInfo(repo: string): Promise<IRepoInfo> {
  if (await gitIsEmpty(repo)) {
    return { files: [] };
  }
  const files = await gitLsTree(repo, 'HEAD');
  const fileNames = files.map((git) => git.path);

  let packageJson = undefined;

  if (fileNames.includes('package.json')) {
    const blob = await gitCatBlob(repo, 'HEAD', 'package.json');
    packageJson = JSON.parse(blob);
  }

  let codeOwners = undefined;

  if (fileNames.includes('.github/CODEOWNERS')) {
    let blob;
    try {
      blob = await gitCatBlob(repo, 'HEAD', '.github/CODEOWNERS');
    } catch (_) {
      blob = null;
    }

    if (blob) {
      codeOwners = parse(blob);
    }
  }

  return { files, packageJson, codeOwners };
}
