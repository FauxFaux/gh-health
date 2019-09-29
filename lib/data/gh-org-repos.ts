import { IsoDate } from '../types';

export interface IRepo {
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
