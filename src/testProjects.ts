import { getWordPressProjects } from './getWordPressProjects';

// Run the function and log the results
const projects = getWordPressProjects('data/projects.xml');
console.log(`Found ${projects.length} projects`);

// Log the first project's details if available
if (projects.length > 0) {
  const firstProject = projects[0];
  console.log('\nFirst project details:');
  console.log(`Title: ${firstProject.title}`);
  console.log(`Slug: ${firstProject.slug}`);
  console.log(`Author: ${firstProject.authorName}`);
  console.log(`Author URL: ${firstProject.authorUrl}`);
  console.log(`Published: ${new Date(firstProject.publishedAt * 1000).toISOString()}`);
  console.log(`Publication Status: ${firstProject.publicationStatus}`);
  console.log(`Course: ${firstProject.course}`);
  console.log(`Tags: ${firstProject.tag.join(', ')}`);
  console.log(`Cover Image: ${firstProject.coverImageSrc}`);
  console.log(`Content Preview: ${firstProject.body.substring(0, 200)}...`);
}
