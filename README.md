# wordpress-to-airtable-cms

Some helper scripts and documentation about how we moved our blog from Wordpress to Airtable.

## Migrate blogs to Airtable

1. [Create an export](https://wordpress.com/support/export/#tab-default-view) of Posts
2. Save that as `posts.xml` in the `data` folder
3. Run `AIRTABLE_API_KEY=pat123.def npm start migrate` (with your Airtable access token)

## Tidy up blog data with AI

1. Run `AIRTABLE_API_KEY=pat123.def ANTHROPIC_API_KEY=sk-ant-abcd npm start fix` (with your Airtable access token and Anthropic API key)
