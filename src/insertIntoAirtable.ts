import { setTimeout } from "timers/promises";
import { CmsBlog, cmsBlogTable, Project, projectTable } from "./airtableTables";
import { AirtableTs } from "airtable-ts";

const db = new AirtableTs({
    apiKey: process.env.AIRTABLE_API_KEY,
})

export const insertIntoAirtable = async (items: CmsBlog[] | Project[], type: 'blog' | 'project' = 'blog') => {
    if (type === 'blog') {
        const blogs = items as CmsBlog[];
        for (const blog of blogs) {
            console.log('Inserting blog:', blog.title);
            const { id, ...blogWithoutId } = blog;
            await db.insert(cmsBlogTable, blogWithoutId);
            await setTimeout(500);
        }
    } else {
        const projects = items as Project[];
        for (const project of projects) {
            console.log('Inserting project:', project.title);
            const { id, ...projectWithoutId } = project;
            await db.insert(projectTable, projectWithoutId);
            await setTimeout(500);
        }
    }
}
