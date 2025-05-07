# wordpress-to-airtable-cms

Some helper scripts and documentation about how we moved our blog and projects from WordPress to Airtable.

## Migrate blogs to Airtable

1. [Create an export](https://wordpress.com/support/export/#tab-default-view) of Posts
2. Save that as `posts.xml` in the `data` folder (or specify a custom path)
3. Run `AIRTABLE_API_KEY=pat123.def npm start migrate-blogs [path-to-xml]` (with your Airtable access token)

## Migrate projects to Airtable

1. [Create an export](https://wordpress.com/support/export/#tab-default-view) of Projects (custom post type)
2. Save that as `projects.xml` in the `data` folder (or specify a custom path)
3. Run `AIRTABLE_API_KEY=pat123.def npm start migrate-projects [path-to-xml]` (with your Airtable access token)

## Tidy up blog data with AI

1. Run `AIRTABLE_API_KEY=pat123.def ANTHROPIC_API_KEY=sk-ant-abcd npm start fix-blogs` (with your Airtable access token and Anthropic API key)

## Tidy up project data with AI

1. Run `AIRTABLE_API_KEY=pat123.def ANTHROPIC_API_KEY=sk-ant-abcd npm start fix-projects` (with your Airtable access token and Anthropic API key)
