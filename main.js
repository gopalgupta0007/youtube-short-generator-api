import express from 'express';
import generateScripts from './models/topic-to-script-generator-ai.js';
import generateImagePrompts from './models/script-to-image-caption-script-generator.js';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';

// Import the video generation function - assuming it's exported from somewhere
// If not, you'll need to create/import it properly
import { generateVideoFromScenesHandler } from './text-to-video-caption-generator-10.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Serve static files
app.use('/output', express.static(path.join(__dirname, 'output')));

// GET endpoint for video generation
app.get('/api/generate-video/:topic', async (req, res) => {
  try {
    // Step 0 : suggest topic to video generate based on viral youtube shorts video keyword 
    // Prompt are to generate trending topics are
    // PROMPT : give me trending topic based on youtube viral video based on facts , motivational or story and output should be give in 0-10 word range in array and atleast have array 5-6 topic 

    // Step 1: Get topic from query parameter
    const topic = req.params.topic;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic parameter is required'
      });
    }

    console.log(`Starting video generation process for topic: ${topic}`);

    // Step 2: Generate scripts
    console.log("Step 1: Generating scripts...");
    const scripts = await generateScripts(topic);
    const cleaned = scripts.replace(/```json\s*/, '').replace(/\s*```$/, '');
    const parsedScript = JSON.parse(cleaned);
    const script = parsedScript.scripts[0].content;
    console.log("Scripts generated successfully");

    // Step 3: Generate image prompts
    console.log("Step 2: Generating image prompts...");
    const imagePrompts = await generateImagePrompts(script);
    const cleanedImagePrompts = imagePrompts.replace(/```json\s*/, '').replace(/\s*```$/, '');
    const parsedImagePrompts = JSON.parse(cleanedImagePrompts);
    console.log("Image prompts generated successfully");

    // Step 4: Generate video
    console.log("Step 3: Generating video...");
    const video = await generateVideoFromScenesHandler(parsedImagePrompts);
    console.log("Video generated successfully");

    // Step 5: Return response with all generated data
    res.status(200).json({
      success: true,
      data: {
        topic,
        script,
        imagePrompts: parsedImagePrompts,
        video
      }
    });

  } catch (error) {
    console.error("Error in video generation process:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate video",
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Video Generation API',
    timestamp: new Date().toISOString()
  });
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Video Generation API',
    version: '1.0.0',
    endpoints: {
      '/api/generate-video': {
        method: 'GET',
        description: 'Generate a video based on a topic',
        parameters: {
          topic: 'The topic to generate a video about (required)'
        },
        example: '/api/generate-video?topic=facts%20on%20earth'
      },
      '/health': {
        method: 'GET',
        description: 'Health check endpoint'
      }
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Video Generation API running on http://localhost:${PORT}`);
  console.log(`Try it: http://localhost:${PORT}/api/generate-video?topic=facts%20on%20earth`);
});

















// main.js
// import express from "express"
// const app = express()
// import generateScripts from './models/topic-to-script-generator-ai.js';
// import generateImagePrompts from './models/script-to-image-caption-script-generator.js';
// import { generateVideoFromScenesHandler } from "./final-text-to-video-caption-generator-7.js";

// // step 1 :- generate scripts
// const topic="facts on earth";
// const scripts=await generateScripts(topic);
// const cleaned = scripts.replace(/```json\s*/, '').replace(/\s*```$/, '');
// const parsedScript = JSON.parse(cleaned);
// const script = parsedScript.scripts[0].content;
// console.log(script);
// console.log("script generated successfully");
// console.log("=".repeat(50))


// // step 2 :- generate image prompts
// const imagePrompts=await generateImagePrompts(script);
// const cleanedImagePrompts = imagePrompts.replace(/```json\s*/, '').replace(/\s*```$/, '');
// const parsedImagePrompts = JSON.parse(cleanedImagePrompts);
// console.log(parsedImagePrompts);
// console.log("image prompts generated successfully");
// console.log("=".repeat(50))


// // step 3 :- generate video by passing script and imagePrompts

// const video=await generateVideoFromScenesHandler(parsedImagePrompts);
// console.log(video);
// console.log("video generated successfully");
// console.log("=".repeat(50))



// app.get('/',(req,res)=>{
//     try {
//       res.json(imagePrompts);
//     } catch (e) {
//       res.status(500).send('Invalid JSON in scripts');
//     }
// })

// app.listen(3000,()=>{
//     console.log("Server is running on port 3000")
// })










// import OpenAI from "openai";
// import express from 'express';
// import dotenv from 'dotenv';


// const app = express();
// const port = 3000;
// dotenv.config();

// // Initialize OpenAI client
// const openai = new OpenAI({ apiKey: "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" });

// app.get('/', async (req, res) => {
//   try {

//     // const openAI_Key = "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"
//     // const client = new OpenAI({ apiKey: openAI_Key })

//     const response = await openai.responses.create({
//       input: "write a two different script for 30 Seconds video on Topic:kids study,\
//                     Give me response in JSON format and follow the schema\
//                     -{\
//                     scripts:[\
//                     {\
//                     content:\"\
//                     },\
//                     ]\
//                     }",
//       model: "gpt-4o-mini"
//     });

//     console.log(response.output_text);
//     res.status(200).send(response.output_text);
//   } catch (error) {
//     console.error("Error generating content from OpenAI:", error);
//     res.status(500).send("Error generating AI content.", error);
//   }
// });

// app.listen(port, () => {
//   console.log(`Server listening at http://localhost:${port}`);
// });


// /**
//  * Generate Image Prompts for Video Scenes
//  * GET /generate-image-prompts
//  */
// app.get('/generate-image-prompts', async (req, res) => {
//   try {
//     // Reuse the same OpenAI client and key already defined
//     const script = req.query.script;
//     if (!script) {
//       return res.status(400).send("Missing 'script' query parameter.");
//     }

//     const prompt = `Generate Image prompt of Cinematic style with all details for each scene for 30 seconds video: script: ${script}

// - Just Give specifying image prompt depends on the story line
// - do not give camera angle image prompt
// - Follow the Following schema and return JSON data (Max 4-5 Images)
// [
// {
// imagePrompt: "",
// sceneContent: "<Script Content>",
// start: <start duration in number>,
// end: <end duration in number>
// }
// ]`;

//     const response = await openai.responses.create({
//       input: prompt,
//       model: "gpt-4o-mini"
//     });

//     console.log(response.output_text);
//     res.status(200).send(response.output_text);
//   } catch (error) {
//     console.error("Error generating image prompts from OpenAI:", error);
//     res.status(500).send("Error generating image prompts.");
//   }
// });




