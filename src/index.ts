import { fixAirtableBodiesWithAi } from './fixBlogBodiesWithAi';
import { migrateBlogsToAirtable } from './storeBlogsInAirtable';

// Check command line arguments to determine which function to run
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    if (command === 'migrate') {
      console.log('Starting WordPress to Airtable migration...');
      await migrateBlogsToAirtable();
      console.log('Migration completed successfully');
    } else if (command === 'fix') {
      console.log('Starting Airtable blog fixing...');
      await fixAirtableBodiesWithAi();
      console.log('Rendering completed successfully');
    } else {
      console.error(`Unknown command: ${command}`);
      console.log(`Usage: ${process.argv.slice(0, 2).join(' ')} <command>`);
      console.log('Available commands:');
      console.log('  migrate - Migrate WordPress blogs to Airtable');
      console.log('  fix  - Fix Airtable blogs with Claude');
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
