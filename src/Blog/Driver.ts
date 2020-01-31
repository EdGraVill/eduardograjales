import axios from 'axios';
import { JSONUncrush, JSONCrush } from '../util';
import MarkdownIt from 'markdown-it';

export default class BlogDriver {
  private readonly instance = axios.create({
    baseURL: 'https://api.github.com/',
  });
  private readonly owner = 'EdGraVill';
  private readonly repo = 'eduardograjales';
  private readonly branch = 'content';

  public async getPostList(): Promise<PostPreview[]> {
    const url = `/repos/${this.owner}/${this.repo}/contents/?ref=${this.branch}`;
    const { data } = await this.instance.get<GithubContentResponse[]>(url);

    const onlyMD = data.filter(({ type, name }) => type === 'file' && name.includes('.md'));
    const withContent = await Promise.all(onlyMD.map(async ({ path, sha, name }, ix) => {
      const content = await this.getContent(path, sha);

      const id = Number(name.replace('.md', '')) || ix;

      localStorage.setItem(`${id}_sha`, sha);
      localStorage.setItem(`${id}_path`, path);

      return {
        ...this.extractTitleAndDescription(content),
        id,
      };
    }));

    localStorage.setItem('postList', JSON.stringify(withContent.sort((a, b) => b.id - a.id).map(({ id }) => id)))

    return withContent.sort((a, b) => b.id - a.id) as PostPreview[];
  }

  public loadPostList(): PostPreview[] {
    const idList: number[] = JSON.parse(localStorage.getItem('postList') || '[]');

    return idList.map((id): PostPreview | null => {
      const content = this.loadContent(localStorage.getItem(`${id}_sha`) || '');

      if (!content) {
        return null;
      }

      return {
        ...this.extractTitleAndDescription(content),
        id,
      };
    }).filter(Boolean) as PostPreview[];
  }

  public async getPost(id: number): Promise<Post> {
    const sha = localStorage.getItem(`${id}_sha`);
    const path = localStorage.getItem(`${id}_path`);

    if (!sha || !path) {
      throw new Error('Content not found');
    }

    const content = await this.getContent(path, sha);
    const { title } = this.extractTitleAndDescription(content);

    return {
      content: new MarkdownIt().render(content),
      id,
      title,
    }
  }

  private loadContent(hash: string): string | null {
    const savedContent = localStorage.getItem(hash);

    if (savedContent) {
      const parsed = decodeURI(JSONUncrush(savedContent)).replace(/%23/g, '#');

      return parsed;
    }

    return null;
  }

  private async getContent(path: string, hash: string): Promise<string> {
    const savedContent = this.loadContent(hash);

    if (savedContent) {
      return savedContent;
    } else {
      const url = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${path}`;
      const { data } = await this.instance.get<string>(url);

      localStorage.setItem(hash, JSONCrush(data));

      return data;
    }
  }

  private extractTitleAndDescription(content: string): { title: string, description: string } {
    const tokens = new MarkdownIt().parse(content, {});

    let title: string = '';
    let description: string = '';

    tokens.forEach((token, ix) => {
      if (token.type === 'heading_open' && token.tag === 'h1' && !title) {
        title = tokens[ix + 1].content;
      }
      if (token.type === 'paragraph_open' && token.tag === 'p' && !description) {
        description = tokens[ix + 1].content.slice(0, 160);
        if (tokens[ix + 1].content.length > 160) {
          description += '...';
        }
      }
    });

    return {
      description,
      title,
    }
  }
}
