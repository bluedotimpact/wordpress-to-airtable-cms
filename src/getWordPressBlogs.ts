import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';
import { CmsBlog } from './airtableTables';

/**
 * Converts WordPress blog posts from an XML export file to CmsBlog objects
 * @returns Array of CmsBlog objects
 */
export const getWordPressBlogs = (): CmsBlog[] => {
  try {
    // Read the XML file
    const xmlData = fs.readFileSync('data/posts.xml', 'utf8');
    
    // Configure XML parser options
    const parserOptions = {
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (name: string) => ['item', 'category', 'wp:postmeta'].includes(name)
    };
    
    // Parse the XML
    const parser = new XMLParser(parserOptions);
    const result = parser.parse(xmlData);
    
    // Initialize Turndown for HTML to Markdown conversion
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    // Add custom rule for images to use Embed component instead of markdown syntax
    turndownService.addRule('images', {
      filter: 'img',
      replacement: function(content, node) {
        // Extract the src attribute from the img tag
        const src = node.getAttribute('src');
        if (src) {
          // Return the Embed component syntax
          return `\n\n<Embed url="${src}" />`;
        }
        return '';
      }
    });

    // Add custom rule for list items to trim whitespace
    turndownService.addRule('listItems', {
      filter: 'li',
      replacement: function(content, node) {
        // Trim whitespace from the content
        const trimmedContent = content.trim();
        // Return the trimmed content with proper list item formatting
        // The parent list type (ul/ol) will be handled by Turndown's default rules
        return trimmedContent;
      }
    });
    
    // Extract blog posts from the parsed data
    const items = result.rss.channel.item || [];
    
    // Map WordPress posts to CmsBlog objects
    return items.map((item: any) => {
      // Extract categories
      const categories = item.category || [];
      const sitesPublishedOn = categories
        .filter((cat: any) => cat['@_domain'] === 'category')
        .map((cat: any) => {
          // Handle different possible structures
          if (typeof cat === 'string') return cat;
          if (cat['#text']) return cat['#text'];
          return cat.toString();
        });
      
      // Extract author metadata
      const postMeta = item['wp:postmeta'] || [];
      
      // Find author name
      const authorMeta = postMeta.find((meta: any) => {
        const metaKey = meta['wp:meta_key'];
        return metaKey && 
          ((typeof metaKey === 'string' && metaKey === 'author') || 
           (metaKey['#text'] && metaKey['#text'] === 'author'));
      });
      
      // Find author URL
      const authorUrlMeta = postMeta.find((meta: any) => {
        const metaKey = meta['wp:meta_key'];
        return metaKey && 
          ((typeof metaKey === 'string' && metaKey === 'author_url') || 
           (metaKey['#text'] && metaKey['#text'] === 'author_url'));
      });
      
      const authorName = authorMeta ? 
        (authorMeta['wp:meta_value']?.['#text'] || authorMeta['wp:meta_value'] || '') : 
        (item['dc:creator']?.['#text'] || item['dc:creator'] || '');
      
      const authorUrl = authorUrlMeta ? 
        (authorUrlMeta['wp:meta_value']?.['#text'] || authorUrlMeta['wp:meta_value'] || '') : 
        '';
      
      // Convert HTML content to Markdown
      let htmlContent = '';
      if (item['content:encoded']) {
        htmlContent = typeof item['content:encoded'] === 'string' ? 
          item['content:encoded'] : 
          (item['content:encoded']['#text'] || '');
      }
      
      let markdownContent = turndownService.turndown(htmlContent);
      
      // Remove caption tags but keep the Embed component inside
      markdownContent = markdownContent.replace(
        /\\\[caption(.*?)\\\]([.\n]*?)<Embed url="([^"]+)" \/>(.*?)\\\[\/caption\\\]/gm, 
        '<Embed url="$2" />'
      );
      
      // Extract title
      let title = '';
      if (item.title) {
        title = typeof item.title === 'string' ? 
          item.title : 
          (item.title['#text'] || '');
      }
      
      // Extract slug
      let slug = '';
      if (item['wp:post_name']) {
        slug = typeof item['wp:post_name'] === 'string' ? 
          item['wp:post_name'] : 
          (item['wp:post_name']['#text'] || '');
      }
      
      // Extract ID
      let id = '';
      if (item['wp:post_id']) {
        id = typeof item['wp:post_id'] === 'string' ? 
          item['wp:post_id'] : 
          (item['wp:post_id']['#text'] || '');
      }
      
      // Extract status
      let status = '';
      if (item['wp:status']) {
        status = typeof item['wp:status'] === 'string' ? 
          item['wp:status'] : 
          (item['wp:status']['#text'] || '');
      }
      
      // Map to CmsBlog type
      return {
        id,
        title,
        slug,
        body: markdownContent,
        publishedAt: item.pubDate || '',
        authorName,
        authorUrl,
        isPublic: status === 'publish',
        sitesPublishedOn
      } as CmsBlog;
    }).filter((blog: CmsBlog) => blog.body.trim().length > 0);
  } catch (error) {
    console.error('Error parsing WordPress XML:', error);
    return [];
  }
}
