import { setTimeout } from "timers/promises";
import { CmsBlog, cmsBlogTable } from "./airtableTables";
import { AirtableTs } from "airtable-ts";

const db = new AirtableTs({
    apiKey: process.env.AIRTABLE_API_KEY,
})

export const insertIntoAirtable = async (blogs: CmsBlog[]) => {
    for (const blog of blogs) {
        console.log('Inserting blog', blog.title);
        const { id, ...blogWithoutId } = blog;
        await db.insert(cmsBlogTable, blogWithoutId);
        await setTimeout(500);
    }
}