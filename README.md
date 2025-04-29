# wordpress-to-airtable-cms

Some helper scripts and documentation about how we moved our blog from Wordpress to Airtable.

## Process

1. [Create an export](https://wordpress.com/support/export/#tab-default-view) of Posts
2. Save that as `posts.xml` in the `data` folder
4. Run `AIRTABLE_API_KEY=pat123.def npm start` (with your Airtable access token)
