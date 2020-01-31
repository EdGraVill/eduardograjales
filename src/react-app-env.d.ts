/// <reference types="react-scripts" />

interface PostPreview {
  title: string;
  id: number;
  description: string;
}

interface Post {
  title: string;
  id: number;
  content: string;
}

interface GithubContentResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: 'file' | 'dir';
  _links: {
      self: string;
      git: string;
      html: string;
  }
}
