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

## Check project rendering on the new site

1. Run `AIRTABLE_API_KEY=pat123.def ANTHROPIC_API_KEY=sk-ant-abcd npm start check-rendering` to check if projects render properly on the new site
2. The script will print any problematic pages to the console with detailed issues

## Migrate CMS files to S3

1. Run `AIRTABLE_API_KEY=your_airtable_api_key WEBSITE_ASSETS_BUCKET_ACCESS_KEY_ID=your_access_key_id WEBSITE_ASSETS_BUCKET_SECRET_ACCESS_KEY=your_secret_access_key npm start migrate-cms-files` to migrate all CMS files to S3
2. The script will find any URLs in blogs and projects that point to the old CMS (cms.bluedot.org/u/...), download those files, upload them to an S3 bucket, and update the links in the text.
