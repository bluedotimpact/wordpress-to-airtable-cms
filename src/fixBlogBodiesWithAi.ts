import puppeteer, { Browser } from 'puppeteer';
import { AirtableTs } from 'airtable-ts';
import { CmsBlog, cmsBlogTable } from './airtableTables';

// Initialize Airtable client
const db = new AirtableTs({
  apiKey: process.env.AIRTABLE_API_KEY,
});

/**
 * Fetches all blogs from Airtable
 * @returns Promise with array of CmsBlog objects
 */
export const fetchBlogsFromAirtable = async (): Promise<CmsBlog[]> => {
  try {
    console.log('Fetching blogs from Airtable...');
    const blogs = (await db.scan(cmsBlogTable)).filter(blog => !blog.aiRewrittenBody);
    console.log(`Successfully fetched ${blogs.length} blogs from Airtable`);
    return blogs;
  } catch (error) {
    console.error('Error fetching blogs from Airtable:', error);
    return [];
  }
};

/**
 * Renders a blog using Puppeteer and returns the HTML content
 * @param url The URL to render
 * @returns Promise with the HTML content after client-side rendering
 */
export const renderBlogWithPuppeteer = async (url: string): Promise<string> => {
  if (!url) {
    console.warn('No URL provided for rendering');
    return '';
  }

  let browser: Browser | null = null;
  try {
    console.log(`Rendering URL: ${url}`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set a reasonable timeout (30 seconds)
    await page.setDefaultNavigationTimeout(30000);
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: 'networkidle2' // Wait until network is idle (no more than 2 connections for at least 500ms)
    });
    
    // Wait for any JavaScript and API requests to execute
    await page.waitForNetworkIdle({ idleTime: 1000 });
    
    // Extract the main blog content HTML based on the URL
    // For old site: .content
    // For new site: .section__body > .markdown-extended-renderer
    const mainContentHtml = await page.evaluate(() => {
      // Try new site selector
      const newSiteContent = document.querySelector('.section__body > .markdown-extended-renderer');
      if (newSiteContent) {
        return {
          type: 'new-site',
          html: newSiteContent.outerHTML
        };
      }

      // Try old site selector
      const oldSiteContent = document.querySelector('.content');
      if (oldSiteContent) {
        return {
          type: 'old-site',
          html: oldSiteContent.outerHTML
        };
      }
      
      // If neither selector matches
      return {
        type: 'unknown',
        html: ''
      };
    });

    return mainContentHtml.html;
  } catch (error) {
    console.error(`Error rendering URL ${url}:`, error);
    return '';
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Fetches blogs from Airtable, renders them with Puppeteer, and updates the markdown
 */
export const fixAirtableBodiesWithAi = async (): Promise<void> => {
  // Fetch blogs from Airtable
  const blogs = await fetchBlogsFromAirtable();
  
  if (blogs.length === 0) {
    console.log('No blogs found in Airtable');
    return;
  }
  
  console.log(`Processing ${blogs.length} blogs...`);
  
  // Process each blog
  for (let i = 0; i < blogs.length; i++) {
    const blog = blogs[i];
    console.log(`\n[${i + 1}/${blogs.length}] Processing blog: ${blog.title}`);
    
    const oldSiteHtml = await renderBlogWithPuppeteer(blog.oldSiteUrl);
    const stagingSiteHtml = await renderBlogWithPuppeteer(blog.stagingSiteUrl);

    console.log(`Old Site HTML:\n${oldSiteHtml}`);
    console.log(`Staging Site HTML:\n${stagingSiteHtml}`);

    const newBody = await getRewrittenBody(oldSiteHtml, stagingSiteHtml, blog.body)
    db.update(cmsBlogTable, { id: blog.id, aiRewrittenBody: newBody });
  }
  
  console.log('\nFinished processing all blogs');
};

/**
 * Rewrites the body markdown to fix any syntax issues by comparing old and new HTML
 * @param oldHtml HTML from the old site
 * @param newHtml HTML from the staging site
 * @param bodyMarkdown Current markdown body content
 * @returns Promise with the improved markdown
 */
const getRewrittenBody = async (oldHtml: string, newHtml: string, bodyMarkdown: string): Promise<string> => {
  if (!oldHtml || !newHtml || !bodyMarkdown) {
    console.warn('Missing required inputs for rewriting body');
    return bodyMarkdown; // Return original if any input is missing
  }

  try {
    console.log('Analyzing HTML differences and rewriting markdown...');
    
    // Create a prompt for Claude to analyze and fix the markdown
    const prompt = `
I need to fix markdown syntax in a blog posts that are being migrated between CMS systems.

Here's the HTML rendered from the old CMS:
\`\`\`html
${oldHtml.substring(0, 10000)} ${oldHtml.length > 10000 ? '... (truncated)' : ''}
\`\`\`

Here's the HTML rendered from the new CMS using the current markdown:
\`\`\`html
${newHtml.substring(0, 10000)} ${newHtml.length > 10000 ? '... (truncated)' : ''}
\`\`\`

Here's the current markdown source:
\`\`\`markdown
${bodyMarkdown}
\`\`\`

Please analyze the differences between the old HTML and new HTML, then fix the markdown syntax to ensure the content renders correctly in the new CMS. We're focusing on the content being the same for users - not it being exactly the same syntax wise.

It might be possible the markdown is already correct - in this case just return back the same markdown.

Common issues to fix:
1. Incorrect or missing newlines (the markdown must use two newlines to separate paragraphs)
2. Improper embedding of media (use <Embed url="..."> for videos and images - not markdown images)
3. Missing list formatting

Return ONLY the fixed markdown with no explanations, backticks, or additional text.
`;

    // Get the improved markdown from Claude
    const improvedMarkdown = await getAnthropicCompletion(prompt);
    
    console.log('Successfully rewrote markdown');
    return improvedMarkdown;
  } catch (error) {
    console.error('Error rewriting body:', error);
    return bodyMarkdown; // Return original on error
  }
}

/**
 * Gets a completion from Anthropic's Claude API
 * @param prompt The prompt to send to Claude
 * @returns Promise with the completion text
 */
const getAnthropicCompletion = async (prompt: string): Promise<string> => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 20_000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Anthropic API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
}
