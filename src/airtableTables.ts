import { Item, Table } from "airtable-ts";

export type CmsBlog = {
  id: string,
  /**
   * Article title
   * Maps from title
   */
  title: string,
  /**
   * The article slug
   * Maps from wp:post_name
   */
  slug: string,
  /**
   * The article content. This should be an MDX string
   * Maps from content:encoded, with transformation
   */
  body: string,
  /**
   * Publish date
   * Maps from pubDate
   */
  publishedAt: string,
  /**
   * Author's name
   * Maps from wp:postmeta -> author
   */
  authorName: string,
  /**
   * URL to author's website
   * Maps from wp:postmeta -> author_url
   */
  authorUrl: string,
  /**
   * Whether the blog post is public.
   * Maps from wp:status
   */
  isPublic: boolean,
  /**
   * Home, AI Safety, Biosecurity
   * Maps from <category domain="category" .../> tags
   */
  sitesPublishedOn: string[],
} & Item;

export const cmsBlogTable: Table<CmsBlog> = {
  name: 'Blog',
  baseId: 'app63L1YChHfS6RJF',
  tableId: 'tblT8jgeG4QWX2Fj4',
  mappings: {
    title: 'fldB4uHuTqUd4JOsw',
    slug: 'fldSy5THCV7WOtYiN',
    body: 'fldesLVb1tJpsNkVl',
    authorName: 'fldBVD1meb54zRK8Q',
    authorUrl: 'fldEOlPQdbEmDxicJ',
    publishedAt: 'fldjp3x46apAPAXo7',
    isPublic: 'fldUmp9uro7Q7eJ6E',
    sitesPublishedOn: 'fld92KvouenaA1Meq',
  },
  schema: {
    title: 'string',
    slug: 'string',
    body: 'string',
    publishedAt: 'string',
    authorName: 'string',
    authorUrl: 'string',
    isPublic: 'boolean',
    sitesPublishedOn: 'string[]',
  },
};