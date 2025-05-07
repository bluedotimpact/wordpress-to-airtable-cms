import { Item, Table } from "airtable-ts";

export type Project = {
  id: string,
  title: string,
  slug: string,
  body: string,
  authorName: string,
  authorUrl: string,
  coverImageSrc: string,
  publishedAt: number,
  publicationStatus: string,
  course: string,
  tag: string[],
  aiRewrittenBody: string
} & Item;

export const projectTable: Table<Project> = {
  name: 'Project',
  baseId: 'app63L1YChHfS6RJF',
  tableId: 'tblYCFWqPy29YIWe6',
  mappings: {
    title: 'fldGyQnG2U6q5p5ny',
    slug: 'fldX2rzTLpj9P9fdP',
    body: 'fldjW7BnaXVCttBQn',
    authorName: 'fldGpZHynFhhAx13S',
    authorUrl: 'fldJiHv2mFQzEdz7L',
    coverImageSrc: 'fldliLiVCys4rLX7S',
    publishedAt: 'fldoTpdgfEBNQgej9',
    publicationStatus: 'fldn7RrnTe80QUEt6',
    course: 'fldNHNMuxmQjaokmY',
    tag: 'fldeTqWZOvybdopnK',
    aiRewrittenBody: 'fldseohzQXN7r1Xy8',
  },
  schema: {
    title: 'string',
    slug: 'string',
    body: 'string',
    authorName: 'string',
    authorUrl: 'string',
    coverImageSrc: 'string',
    publishedAt: 'number',
    publicationStatus: 'string',
    course: 'string',
    tag: 'string[]',
    aiRewrittenBody: 'string',
  },
};

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
  oldSiteUrl: string,
  stagingSiteUrl: string
  aiRewrittenBody: string
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
    oldSiteUrl: 'fldahq30FLOUnAdFM',
    stagingSiteUrl: 'fldbLeZa6KRqq1so9',
    aiRewrittenBody: 'fldnK2BnHtBUqlGD6',
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
    oldSiteUrl: 'string',
    stagingSiteUrl: 'string',
    aiRewrittenBody: 'string',
  },
};
