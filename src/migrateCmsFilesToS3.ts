import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { AirtableTs } from 'airtable-ts';
import axios from 'axios';
import path from 'path';
import { randomUUID } from 'crypto';
import { CmsBlog, Project, cmsBlogTable, projectTable } from './airtableTables';

// Initialize S3 client
const s3Client = new S3Client({
  region: 'minio',
  endpoint: 'https://storage.k8s.bluedot.org',
  forcePathStyle: true,
  credentials: {
    accessKeyId: String(process.env.WEBSITE_ASSETS_BUCKET_ACCESS_KEY_ID),
    secretAccessKey: String(process.env.WEBSITE_ASSETS_BUCKET_SECRET_ACCESS_KEY),
  },
});

// Initialize Airtable client
const db = new AirtableTs({
  apiKey: process.env.AIRTABLE_API_KEY,
});

const BUCKET_NAME = 'website-assets';
const OLD_CMS_URL_PATTERN = /https?:\/\/cms\.bluedot\.org\/u\/([^"'\s)]+)/g;

/**
 * Downloads a file from a URL
 * @param url URL to download from
 * @returns Buffer containing the file data
 */
async function downloadFile(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`Error downloading file from ${url}:`, error);
    throw error;
  }
}

/**
 * Uploads a file to S3
 * @param fileBuffer Buffer containing the file data
 * @param contentType MIME type of the file
 * @returns URL of the uploaded file
 */
async function uploadToS3(fileBuffer: Buffer, contentType: string): Promise<string> {
  try {
    // Generate a unique filename
    const fileExtension = getFileExtension(contentType);
    const fileName = `migrated/${randomUUID()}${fileExtension}`;

    // Upload the file to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    // Return the URL of the uploaded file
    return `https://storage.k8s.bluedot.org/${BUCKET_NAME}/${fileName}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

/**
 * Gets the file extension from a content type
 * @param contentType MIME type
 * @returns File extension including the dot
 */
function getFileExtension(contentType: string): string {
  const parts = contentType.split('/');
  return `.${parts[parts.length - 1]}`;
}

/**
 * Guesses the content type from a URL
 * @param url URL to guess content type from
 * @returns MIME type
 */
function guessContentType(url: string): string {
  const extension = path.extname(url).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Finds and replaces old CMS URLs in text with new S3 URLs
 * @param text Text to search for URLs
 * @returns Object containing the updated text and a map of old URLs to new URLs
 */
async function replaceOldCmsUrls(text: string): Promise<{ updatedText: string, urlMap: Map<string, string> }> {
  const urlMap = new Map<string, string>();
  const matches = text.match(OLD_CMS_URL_PATTERN) || [];
  
  // Get unique URLs
  const uniqueUrls = [...new Set(matches)];
  
  // Process each URL
  for (const oldUrl of uniqueUrls) {
    try {
      console.log(`Processing URL: ${oldUrl}`);

      // Download the file
      const fileBuffer = await downloadFile(oldUrl);
      
      // Guess the content type
      const contentType = guessContentType(oldUrl);
      
      // Upload to S3
      const newUrl = await uploadToS3(fileBuffer, contentType);
      
      // Store the mapping
      urlMap.set(oldUrl, newUrl);
      
      console.log(`Migrated ${oldUrl} to ${newUrl}`);
    } catch (error) {
      console.error(`Failed to process URL ${oldUrl}:`, error);
    }
  }
  
  // Replace all occurrences in the text
  let updatedText = text;
  for (const [oldUrl, newUrl] of urlMap.entries()) {
    updatedText = updatedText.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
  }
  
  return { updatedText, urlMap };
}

/**
 * Processes blogs to migrate CMS files to S3
 */
async function processBlogs() {
  try {
    console.log('Fetching blogs from Airtable...');
    const blogs = await db.scan<CmsBlog>(cmsBlogTable);
    console.log(`Found ${blogs.length} blogs`);
    
    let totalUrlsProcessed = 0;
    let totalBlogsUpdated = 0;
    
    for (const blog of blogs) {
      console.log(`Processing blog: ${blog.title}`);
      
      // Process the body field
      const { updatedText, urlMap } = await replaceOldCmsUrls(blog.body);
      
      // If URLs were found and replaced, update the blog
      if (urlMap.size > 0) {
        totalUrlsProcessed += urlMap.size;
        totalBlogsUpdated++;
        
        console.log(`Updating blog "${blog.title}" with ${urlMap.size} replaced URLs`);
        
        // Update the blog in Airtable
        await db.update(cmsBlogTable, {
          id: blog.id,
          body: updatedText
        });
        
        console.log(`Blog "${blog.title}" updated successfully`);
      }
    }
    
    console.log(`Processed ${totalUrlsProcessed} URLs across ${totalBlogsUpdated} blogs`);
  } catch (error) {
    console.error('Error processing blogs:', error);
  }
}

/**
 * Processes projects to migrate CMS files to S3
 */
async function processProjects() {
  try {
    console.log('Fetching projects from Airtable...');
    const projects = await db.scan<Project>(projectTable);
    console.log(`Found ${projects.length} projects`);
    
    let totalUrlsProcessed = 0;
    let totalProjectsUpdated = 0;
    
    for (const project of projects) {
      console.log(`Processing project: ${project.title}`);
      
      // Process the body field
      const { updatedText, urlMap } = await replaceOldCmsUrls(project.body);
      
      // Check if the cover image is from the old CMS
      let coverImageUpdated = false;
      let newCoverImageSrc = project.coverImageSrc;
      
      if (project.coverImageSrc && OLD_CMS_URL_PATTERN.test(project.coverImageSrc)) {
        try {
          console.log(`Processing cover image: ${project.coverImageSrc}`);
          
          // Download the file
          const fileBuffer = await downloadFile(project.coverImageSrc);
          
          // Guess the content type
          const contentType = guessContentType(project.coverImageSrc);
          
          // Upload to S3
          newCoverImageSrc = await uploadToS3(fileBuffer, contentType);
          
          coverImageUpdated = true;
          totalUrlsProcessed++;
          
          console.log(`Migrated cover image from ${project.coverImageSrc} to ${newCoverImageSrc}`);
        } catch (error) {
          console.error(`Failed to process cover image ${project.coverImageSrc}:`, error);
        }
      }
      
      // If URLs were found and replaced, or cover image was updated, update the project
      if (urlMap.size > 0 || coverImageUpdated) {
        totalUrlsProcessed += urlMap.size;
        totalProjectsUpdated++;
        
        console.log(`Updating project "${project.title}" with ${urlMap.size} replaced URLs${coverImageUpdated ? ' and updated cover image' : ''}`);
        
        // Update the project in Airtable
        await db.update(projectTable, {
          id: project.id,
          body: updatedText,
          ...(coverImageUpdated ? { coverImageSrc: newCoverImageSrc } : {})
        });
        
        console.log(`Project "${project.title}" updated successfully`);
      }
    }
    
    console.log(`Processed ${totalUrlsProcessed} URLs across ${totalProjectsUpdated} projects`);
  } catch (error) {
    console.error('Error processing projects:', error);
  }
}

/**
 * Main function to migrate CMS files to S3
 */
export async function migrateCmsFilesToS3() {
  try {
    console.log('Starting migration of CMS files to S3...');
    
    // Process blogs
    await processBlogs();
    
    // Process projects
    await processProjects();
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}
