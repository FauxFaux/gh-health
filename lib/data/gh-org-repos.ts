import { IsoDate } from '../types';

export interface IRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    // ...
  };
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

export interface ITeam {
  name: string;
  id: number;
  node_id: string;
  slug: string;
  description: string;
  privacy: 'closed';
  url: string;
  html_url: string;
  members_url: string;
  repositories_url: string;
  permission: 'admin' | 'pull' | 'push';
}
