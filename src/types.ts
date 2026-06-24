export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  html_url: string;
  description: string | null;
  private: boolean;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  forks_count: number;
}

export interface CommitInfo {
  sha: string;
  message: string;
  date: string;
  author: string;
  authorAvatar: string;
  repoName: string;
  repoFullName: string;
  htmlUrl: string;
  authorUrl?: string;
}

export interface AIAchievement {
  title: string;
  description: string;
  icon: string;
}

export interface AICategory {
  name: string;
  percentage: number;
  description: string;
}

export interface AIAnalysisResult {
  summary: string;
  achievements: AIAchievement[];
  categories: AICategory[];
  technologies: string[];
  insights: string[];
}
