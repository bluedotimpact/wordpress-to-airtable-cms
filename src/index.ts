import { getWordPressBlogs } from './getWordPressBlogs';
import { insertIntoAirtable } from './insertIntoAirtable';

// Get the blogs
const blogs = getWordPressBlogs();

// Log the number of blogs found
console.log(`Found ${blogs.length} blogs`);

// Log the first blog's details as a sample
if (blogs.length > 0) {
  const firstBlog = blogs[0];
  console.log('\nSample blog details:');
  console.log(`Title: ${firstBlog.title}`);
  console.log(`Slug: ${firstBlog.slug}`);
  console.log(`Author: ${firstBlog.authorName}`);
  console.log(`Author URL: ${firstBlog.authorUrl}`);
  console.log(`Published: ${firstBlog.publishedAt}`);
  console.log(`Is Public: ${firstBlog.isPublic}`);
  console.log(`Sites Published On: ${firstBlog.sitesPublishedOn.join(', ')}`);
  console.log(`Content Preview: ${firstBlog.body.substring(0, 200)}...`);
}

console.log('Inserting into Airtable')
await insertIntoAirtable(blogs);
console.log(`Successfully inserted ${blogs.length} blogs into Airtable`)