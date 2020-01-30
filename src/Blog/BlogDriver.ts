export default class BlogDriver {
  constructor() {
  }

  async getPostList(): Promise<PostPreview[]> {}

  loadPost(id: string): Post {}
}
