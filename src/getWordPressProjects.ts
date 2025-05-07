import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';
import TurndownService from 'turndown';
import { Project } from './airtableTables';

/**
 * Converts WordPress project posts from an XML export file to Project objects
 * @returns Array of Project objects
 */
export const getWordPressProjects = (filePath: string = 'data/projects.xml'): Project[] => {
  try {
    // Read the XML file
    const xmlData = fs.readFileSync(filePath, 'utf8');
    
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
    
    // Extract project posts from the parsed data
    const items = result.rss.channel.item || [];
    
    console.log(`Total items in XML: ${items.length}`);
    
    // Filter to only include items with post_type === 'project'
    const projectItems = items.filter((item: any) => {
      const postType = item['wp:post_type'];
      // Log each item's post type for debugging
      console.log(`Item title: ${item.title}, post type: ${postType}`);
      
      return postType && 
        ((typeof postType === 'string' && postType === 'project') || 
         (postType['#text'] && postType['#text'] === 'project'));
    });

    const attachments = items.filter((item: any) => {
      const postType = item['wp:post_type'];
      // Log each item's post type for debugging
      console.log(`Item title: ${item.title}, post type: ${postType}`);
      
      return postType && 
        ((typeof postType === 'string' && postType === 'attachment') || 
         (postType['#text'] && postType['#text'] === 'attachment'));
    });
    
    console.log(`Filtered project items: ${projectItems.length}`);
    
    // Map WordPress posts to Project objects
    return projectItems.map((item: any) => {
      // Extract tags/categories
      const categories = item.category || [];
      const tags = categories
        .filter((cat: any) => cat['@_domain'] === 'post_tag')
        .map((cat: any) => {
          // Handle different possible structures
          if (typeof cat === 'string') return cat;
          if (cat['#text']) return cat['#text'];
          return cat.toString();
        });
      
      // Extract course/collection
      const courseCategories = categories
        .filter((cat: any) => cat['@_domain'] === 'project_collection')
        .map((cat: any) => {
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
      
      // Find cover image
      const thumbnailIdMeta = postMeta.find((meta: any) => {
        const metaKey = meta['wp:meta_key'];
        return metaKey && 
          ((typeof metaKey === 'string' && metaKey === '_thumbnail_id') || 
           (metaKey['#text'] && metaKey['#text'] === '_thumbnail_id'));
      });
      
      // Find attachment URL
      const attachmentUrlMeta = postMeta.find((meta: any) => {
        const metaKey = meta['wp:meta_key'];
        return metaKey && 
          ((typeof metaKey === 'string' && metaKey === 'wp:attachment_url') || 
           (metaKey['#text'] && metaKey['#text'] === 'wp:attachment_url'));
      });
      
      // Extract values
      const authorName = authorMeta ? 
        (authorMeta['wp:meta_value']?.['#text'] || authorMeta['wp:meta_value'] || '') : 
        (item['dc:creator']?.['#text'] || item['dc:creator'] || '');
      
      const authorUrl = authorUrlMeta ? 
        (authorUrlMeta['wp:meta_value']?.['#text'] || authorUrlMeta['wp:meta_value'] || '') : 
        '';
      
      // Use attachment URL if available, otherwise use a placeholder
      let coverImageSrc = '';
      const attachment = attachments.find((attachment) => {
        return thumbnailIdMeta && thumbnailIdMeta['wp:meta_value'] == attachment['wp:post_id'];
      })
      if (attachment) {
        coverImageSrc = attachment['wp:attachment_url']?.['#text'] || attachment['wp:attachment_url'] || '';
      } else if (attachmentUrlMeta) {
        coverImageSrc = attachmentUrlMeta['wp:meta_value']?.['#text'] || attachmentUrlMeta['wp:meta_value'] || '';
      } else if (item['wp:attachment_url']) {
        coverImageSrc = typeof item['wp:attachment_url'] === 'string' ? 
          item['wp:attachment_url'] : 
          (item['wp:attachment_url']['#text'] || '');
      }
      
      // Convert HTML content to Markdown
      let htmlContent = '';
      if (item['content:encoded']) {
        htmlContent = typeof item['content:encoded'] === 'string' ? 
          item['content:encoded'] : 
          (item['content:encoded']['#text'] || '');
      }
      
      let markdownContent = turndownService.turndown(htmlContent);
      
      // Remove caption tags but keep the Embed component
      markdownContent = markdownContent.replace(
        /\\\[caption(.*?)\\\]([\s\S]*?)<Embed url="([^"]+)" \/>([\s\S]*?)\\\[\/caption\\\]/gm, 
        '<Embed url="$3" />'
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
      
      // Extract publish date and convert to timestamp (in seconds)
      let publishedAt = 0;
      if (item.pubDate) {
        const pubDateStr = typeof item.pubDate === 'string' ? 
          item.pubDate : 
          (item.pubDate['#text'] || '');
        
        if (pubDateStr) {
          // Convert to timestamp in seconds (not milliseconds)
          publishedAt = Math.floor(new Date(pubDateStr).getTime() / 1000);
        }
      }
      
      // Map to Project type
      return {
        id,
        title,
        slug,
        body: markdownContent,
        authorName,
        authorUrl,
        coverImageSrc,
        publishedAt,
        publicationStatus: status,
        course: courseCategories.length > 0 ? courseCategories[0] : '',
        tag: tags,
        aiRewrittenBody: '' // Initialize with empty string
      } as Project;
    }).filter((project: Project) => project.body.trim().length > 0);
  } catch (error) {
    console.error('Error parsing WordPress XML:', error);
    return [];
  }
}
