import { getWordPressProjects } from './getWordPressProjects';
import { insertIntoAirtable } from './insertIntoAirtable';
import { Project } from './airtableTables';

export const migrateProjectsToAirtable = async (filePath?: string) => {
  // Get the projects
  const projects = getWordPressProjects(filePath);

  // Log the number of projects found
  console.log(`Found ${projects.length} projects`);

  // Log the first project's details as a sample
  if (projects.length > 0) {
    const firstProject = projects[0];
    console.log('\nSample project details:');
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

  console.log('Inserting into Airtable');
  await insertIntoAirtable(projects, 'project');
  console.log(`Successfully inserted ${projects.length} projects into Airtable`);
};
