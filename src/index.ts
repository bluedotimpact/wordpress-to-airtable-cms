import { fixAirtableBodiesWithAi } from './fixBlogBodiesWithAi';
import { fixProjectBodiesWithAi } from './fixProjectBodiesWithAi';
import { migrateBlogsToAirtable } from './storeBlogsInAirtable';
import { migrateProjectsToAirtable } from './storeProjectsInAirtable';
import { checkAllProjectRendering } from './checkProjectRendering';

// Check command line arguments to determine which function to run
const args = process.argv.slice(2);
const command = args[0];
const filePath = args[1]; // Optional file path argument

async function main() {
  try {
    if (command === 'migrate-blogs') {
      console.log('Starting WordPress blogs to Airtable migration...');
      await migrateBlogsToAirtable(filePath);
      console.log('Blog migration completed successfully');
    } else if (command === 'migrate-projects') {
      console.log('Starting WordPress projects to Airtable migration...');
      await migrateProjectsToAirtable(filePath);
      console.log('Project migration completed successfully');
    } else if (command === 'fix-blogs') {
      console.log('Starting Airtable blog fixing...');
      await fixAirtableBodiesWithAi();
      console.log('Blog fixing completed successfully');
    } else if (command === 'fix-projects') {
      console.log('Starting Airtable project fixing...');
      await fixProjectBodiesWithAi();
      console.log('Project fixing completed successfully');
    } else if (command === 'check-rendering') {
      console.log('Starting project rendering check...');
      await checkAllProjectRendering();
      console.log('Rendering check completed successfully');
    } else {
      console.error(`Unknown command: ${command}`);
      console.log(`Usage: ${process.argv.slice(0, 2).join(' ')} <command> [file-path]`);
      console.log('Available commands:');
      console.log('  migrate-blogs [file-path] - Migrate WordPress blogs to Airtable');
      console.log('  migrate-projects [file-path] - Migrate WordPress projects to Airtable');
      console.log('  fix-blogs - Fix Airtable blog bodies with Claude AI');
      console.log('  fix-projects - Fix Airtable project bodies with Claude AI');
      console.log('  check-rendering - Check if projects render properly on the new site');
    }
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
