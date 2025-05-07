import puppeteer, { Browser } from 'puppeteer';
import { AirtableTs } from 'airtable-ts';
import { Project, projectTable } from './airtableTables';

// Initialize Airtable client
const db = new AirtableTs({
  apiKey: process.env.AIRTABLE_API_KEY,
});

/**
 * Fetches all projects from Airtable
 * @returns Promise with array of Project objects
 */
export const fetchProjectsFromAirtable = async (): Promise<Project[]> => {
  try {
    console.log('Fetching projects from Airtable...');
    const projects = (await db.scan(projectTable)).sort((a, b) => a.slug.localeCompare(b.slug));
    console.log(`Successfully fetched ${projects.length} projects from Airtable`);
    return projects;
  } catch (error) {
    console.error('Error fetching projects from Airtable:', error);
    return [];
  }
};

/**
 * Renders a project using Puppeteer and returns the HTML content and screenshot
 * @param url The URL to render
 * @returns Promise with the HTML content and screenshot after client-side rendering
 */
export const renderProjectWithPuppeteer = async (url: string): Promise<{html: string, screenshot: any}> => {
  if (!url) {
    console.warn('No URL provided for rendering');
    return { html: '', screenshot: null };
  }

  let browser: Browser | null = null;
  try {
    console.log(`Rendering URL: ${url}`);
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport size to capture more content
    await page.setViewport({ width: 1280, height: 1024 });
    
    // Set a reasonable timeout (30 seconds)
    await page.setDefaultNavigationTimeout(30000);
    
    // Navigate to the URL
    await page.goto(url, { 
      waitUntil: 'networkidle2' // Wait until network is idle (no more than 2 connections for at least 500ms)
    });
    
    // Wait for any JavaScript and API requests to execute
    await page.waitForNetworkIdle({ idleTime: 1000 });
    
    // Take a screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    
    // Extract the main project content HTML
    const html = await page.evaluate(() => {
      // Try to find the main content container for the new site
      const newSiteContent = document.querySelector('.section__body > .markdown-extended-renderer');
      if (newSiteContent) {
        return newSiteContent.outerHTML;
      }
      
      // Fallback to body if specific container not found
      return document.body.innerHTML;
    });

    return { html, screenshot };
  } catch (error) {
    console.error(`Error rendering URL ${url}:`, error);
    return { html: '', screenshot: null };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

/**
 * Checks if a project has rendered properly using AI
 * @param html The HTML content of the rendered page
 * @param project The project object
 * @returns Promise with the analysis result
 */
export const checkProjectRendering = async (html: string, project: Project): Promise<{
  isProperlyRendered: boolean,
  issues: string[]
}> => {
  try {
    // Create a prompt for Claude to analyze the rendering
    const prompt = `
You are an expert web developer tasked with checking if a project page has rendered properly.

Here's information about the project:
- Title: ${project.title}
- Author: ${project.authorName}
- Content Preview: ${project.body.substring(0, 500)}...

Here's the HTML of the rendered page:
\`\`\`html
${html.substring(0, 15000)} ${html.length > 15000 ? '... (truncated)' : ''}
\`\`\`

Please analyze the HTML and determine if the page has rendered properly. Look for these common issues:
1. Missing content (e.g., the project body is not visible)
2. Broken images or media embeds
3. Formatting problems (e.g., headings, lists, paragraphs not displaying correctly)
4. JavaScript errors visible on the page
5. "Page not found" or error messages

Only include actual rendering issues, not content quality or style suggestions.

Respond with a JSON object in this exact format:
{
  "isProperlyRendered": true/false,
  "issues": ["Issue 1", "Issue 2", ...] (empty array if no issues)
}

DO NOT include any other text in your response.
`;

    // Get the analysis from Claude
    const analysis = await getAnthropicCompletion(prompt);
    
    // Parse the JSON response
    try {
      return JSON.parse(analysis);
    } catch (error) {
      console.error('Error parsing AI response as JSON:', error);
      console.log('Raw AI response:', analysis);
      return {
        isProperlyRendered: false,
        issues: ['Error parsing AI response']
      };
    }
  } catch (error) {
    console.error('Error checking project rendering:', error);
    return {
      isProperlyRendered: false,
      issues: [`Error checking rendering: ${error.message}`]
    };
  }
};

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
        max_tokens: 4000,
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
};

/**
 * Main function to check all projects for rendering issues
 */
export const checkAllProjectRendering = async (): Promise<void> => {
  // Fetch projects from Airtable
  const projects = await fetchProjectsFromAirtable();
  
  if (projects.length === 0) {
    console.log('No projects found in Airtable');
    return;
  }
  
  console.log(`Checking rendering for ${projects.length} projects...`);
  
  interface ProblematicProject {
    title: string;
    slug: string;
    url: string;
    issues: string[];
  }
  
  const problematicProjects: ProblematicProject[] = [];
  
  // Process each project
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    console.log(`\n[${i + 1}/${projects.length}] Checking project: ${project.title}`);
    
    // Construct URL for the new site
    const newSiteUrl = `https://website-staging.k8s.bluedot.org/projects/${project.slug}`;
    
    // Render the project HTML from the new site
    const { html, screenshot } = await renderProjectWithPuppeteer(newSiteUrl);
    
    // Check if the project has rendered properly
    const renderingCheck = await checkProjectRendering(html, project);
    
    if (!renderingCheck.isProperlyRendered) {
      console.log(`⚠️ RENDERING ISSUES DETECTED for project: ${project.title}`);
      console.log(`URL: ${newSiteUrl}`);
      console.log('Issues:');
      renderingCheck.issues.forEach(issue => console.log(`- ${issue}`));
      
      // Save the problematic project details
      problematicProjects.push({
        title: project.title,
        slug: project.slug,
        url: newSiteUrl,
        issues: renderingCheck.issues
      });
    } else {
      console.log(`✅ Project rendered properly: ${project.title}`);
    }
  }
  
  // Print summary of problematic projects
  if (problematicProjects.length > 0) {
    console.log('\n\n==== SUMMARY OF PROBLEMATIC PROJECTS ====');
    console.log(`Found ${problematicProjects.length} projects with rendering issues:`);
    
    problematicProjects.forEach((project, index) => {
      console.log(`\n${index + 1}. ${project.title}`);
      console.log(`   URL: ${project.url}`);
      console.log('   Issues:');
      project.issues.forEach(issue => console.log(`   - ${issue}`));
    });
  } else {
    console.log('\n\n✅ All projects rendered properly!');
  }
  
  console.log('\nFinished checking all projects');
};
