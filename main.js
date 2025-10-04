import express from "express"
const app = express()
import generateScripts from './models/topic-to-script-generator-ai.js';
import generateImagePrompts from './models/script-to-image-caption-script-generator.js';

// step 1 :- generate scripts
const topic="thursty crow story";
const scripts=await generateScripts(topic);
const cleaned = scripts.replace(/```json\s*/, '').replace(/\s*```$/, '');
const parsedScript = JSON.parse(cleaned);
const script = parsedScript.scripts[0].content;
console.log(script);
console.log("script generated successfully");
console.log("=".repeat(50))


// step 2 :- generate image prompts
const imagePrompts=await generateImagePrompts(script);
const cleanedImagePrompts = imagePrompts.replace(/```json\s*/, '').replace(/\s*```$/, '');
console.log(JSON.parse(cleanedImagePrompts));
console.log("image prompts generated successfully");
console.log("=".repeat(50))


// step 3 :- generate video by passing script and imagePrompts

// not yet created
// import generateVideo from './models/video-generator.js';
// const video=await generateVideo(script,imagePrompts);
// console.log(video);
// console.log("video generated successfully");
// console.log("=".repeat(50))



app.get('/',(req,res)=>{
    try {
      res.json(imagePrompts);
    } catch (e) {
      res.status(500).send('Invalid JSON in scripts');
    }
})

app.listen(3000,()=>{
    console.log("Server is running on port 3000")
})










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




