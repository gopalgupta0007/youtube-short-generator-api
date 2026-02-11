import { Ollama } from 'ollama';
import dotenv from 'dotenv';
dotenv.config();

const ollama = new Ollama({ host: 'http://localhost:11434' });

export default async function generateImagePrompts(script) {
    try {
        console.log("Generating scripts for script:", script, "...");

        if (!script || typeof script !== 'string') {
            throw new Error('script must be a non-empty string');
        }

        const response = await ollama.generate({
            model: 'llama2:latest', // or 'llama3.2' or 'llama3.1:8b'
            prompt: `You are an AI scene writer for short cinematic videos.

                INPUT:
                - A full narration script will be provided as: ${script}
                
                GOAL:
                Convert the script into a 30-second video plan with EXACTLY 6 scenes.
                Each scene represents a visual image + spoken narration.
                each scene of imagePrompt and sceneContent should not be same and it should be relevent to script.
                
                You MUST extract real story details from the script.
                You are NOT allowed to use generic or placeholder text.
                
                SCENE RULES (MANDATORY):
                - Total scenes: EXACTLY 6
                - Each scene duration: EXACTLY 5 seconds
                - each scene should have start and end
                - Scene timings must be:
                  Scene 1 → 0-5
                  Scene 2 → 5-10
                  Scene 3 → 10-15
                  Scene 4 → 15-20
                  Scene 5 → 20-25
                  Scene 6 → 25-30
                
                IMAGE PROMPT RULES:
                - imagePrompt MUST describe the exact story moment from the script.
                - Include characters, setting, emotions, lighting, and actions.
                - Be cinematic, vivid, and realistic.
                - Each imagePrompt must be different and story-progressive.
                - DO NOT mention camera, lens, angle, shot, POV, or movement.
                - generate imagePrompt should be relavent to script
                - DO NOT use generic phrases like:
                  "detailed cinematic description"
                  "scene based image"
                  "derived from the script"
                
                sceneContent RULES (VOICE-OVER):
                - This is the exact narration spoken during the scene.
                - generate sceneContent should be relavent to script, like human tone text.
                - Must sound like real human storytelling.
                - Length: 70-80 characters.
                - Insert \\n after every 5-6 words.
                - Content must match the same scene's image.
                - DO NOT repeat narration between scenes.
                - DO NOT use generic filler text.
                
                ANTI-PLACEHOLDER RULE (VERY IMPORTANT):
                - Do NOT use template words such as:
                  "Human narration"
                  "Image prompt"
                  "Scene description"
                  "This scene shows"
                - Every sentence must reference actual story events.
                
                OUTPUT FORMAT (STRICT):
                - Return ONLY valid JSON.
                - No markdown.
                - No comments.
                - No explanations.
                
                REQUIRED STRUCTURE:
                
                {
                  "scenes": [
                    {
                      "imagePrompt": "<real story-based cinematic image description>",
                      "sceneContent": "<real narration text with \\n line breaks>",
                      "start": 0,
                      "end": 5
                    },
                    {
                      "imagePrompt": "<real story-based cinematic image description>",
                      "sceneContent": "<real narration text with \\n line breaks>",
                      "start": 5,
                      "end": 10
                    },
                    {
                      "imagePrompt": "<real story-based cinematic image description>",
                      "sceneContent": "<real narration text with \\n line breaks>",
                      "start": 10,
                      "end": 15
                    },
                    {
                      "imagePrompt": "<real story-based cinematic image description>",
                      "sceneContent": "<real narration text with \\n line breaks>",
                      "start": 15,
                      "end": 20
                    },
                    {
                      "imagePrompt": "<real story-based cinematic image description>",
                      "sceneContent": "<real narration text with \\n line breaks>",
                      "start": 20,
                      "end": 25
                    },
                    {
                      "imagePrompt": "<real story-based cinematic image description>",
                      "sceneContent": "<real narration text with \\n line breaks>",
                      "start": 25,
                      "end": 30
                    }
                  ]
                }
                
                If you cannot infer real content from the script, retry internally.
                Now generate all 6 scenes strictly based on the script.
                
                `,
            format: 'json'
        });

        const result = JSON.parse(response.response);
        console.log("generated done => ", result);
        return result;

    } catch (error) {
        console.error("Error generating content from Ollama:", error);
        throw error;
    }
}