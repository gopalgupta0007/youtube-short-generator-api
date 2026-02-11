import { Ollama } from 'ollama';
import dotenv from 'dotenv';
dotenv.config();

const ollama = new Ollama({ host: 'http://localhost:11434' });

export default async function generateScripts(topic) {
  try {
    console.log("Generating scripts for topic:", topic, "...");

    if (!topic || typeof topic !== 'string') {
      throw new Error('Topic must be a non-empty string');
    }

    const response = await ollama.generate({
      model: 'llama2:latest', // or 'llama3.2' or 'llama3.1:8b'
      prompt: `Write two different scripts for a 30-second video on topic: ${topic}. 
            
            Respond ONLY with valid JSON in this exact format:
            {
                "scripts": [
                    {
                        "content": "script 1 text here"
                    },
                    {
                        "content": "script 2 text here"
                    }
                ]
            }`,
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