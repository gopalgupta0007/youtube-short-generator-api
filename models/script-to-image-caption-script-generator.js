import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate Image Prompts for Video Scenes
 * @param {string} script - The script content to generate image prompts for
 * @returns {Promise<string>} - The generated image prompts JSON string
 */
export default async function generateImagePrompts(script) {
    console.log("Generating Images Prompts for Script: ", script);
    try {
        if (!script) {
            throw new Error("Missing 'script' parameter.");
        }

        const prompt = `Generate Image prompt of Cinematic style with all details for each scene for 30 seconds video: script: ${script}

            - Just Give specifying image prompt depends on the story line
            - do not give camera angle image prompt
            - Follow the Following schema and return JSON data (Max 4-5 Images)
            [
            {
            imagePrompt: "",
            sceneContent: "<Script Content>",
            start: <start duration in number>,
            end: <end duration in number>
            }
            ]`;

        const response = await openai.responses.create({
            input: prompt,
            model: "gpt-4o-mini"
        });

        // console.log(response.output_text);
        return response.output_text;
    } catch (error) {
        console.error("Error generating image prompts:", error);
        throw error;
    }
}
