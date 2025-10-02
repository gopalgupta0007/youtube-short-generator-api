import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function generateScripts(topic) {
    try {
        console.log("Generating scripts for topic:", topic,"...");

        // Validate topic
        if (!topic || typeof topic !== 'string') {
            throw new Error('Topic must be a non-empty string');
        }
        
        const response = await openai.responses.create({
            input: `write a two different script for 30 Seconds video on Topic:${topic},\
                    Give me response in JSON format and follow the schema\
                    -{\
                    scripts:[\
                    {\
                    content:\"
                    \",\
                    },\
                    ]\
                    }`,
            model: "gpt-4o-mini"
        });

        console.log(response.output_text);
        return response.output_text;
    } catch (error) {
        console.error("Error generating content from OpenAI:", error);
        throw error;
    }
}
