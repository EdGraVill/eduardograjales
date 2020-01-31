import * as React from 'react';
import BlogDriver from './Driver';

const Blog: React.FC = () => {
  const blog = new BlogDriver();

  const [list, setList] = React.useState<PostPreview[]>(blog.loadPostList());

  React.useEffect(() => {
    blog.getPostList().then((postList) => setList(postList));
  }, [blog]);

  return (
    <div>
      {list.map(({ description, id, title }) => (
        <div key={id}>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      ))}
    </div>
  );
};

export default Blog;
