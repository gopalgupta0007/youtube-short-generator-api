import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCV3E-pCVKEtfFaC8lZKJy9ugLoWTfC55M");

export default async function generateScripts(topic) {
  if (!topic) throw new Error("topic is required");

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const result = await model.generateContent(`
Write two different scripts for a 30-second video on topic: ${topic}.

Respond ONLY with valid JSON in this exact format:
{
  "scripts": [
    { "content": "script 1 text here" },
    { "content": "script 2 text here" }
  ]
}
`);

  return result.response.text();
}
