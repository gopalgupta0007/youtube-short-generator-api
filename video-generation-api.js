import express from 'express';
import generateScripts from './models/topic-to-script-generator-ai.js';
import generateImagePrompts from './models/script-to-image-caption-script-generator.js';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';

// Import the video generation function - assuming it's exported from somewhere
// If not, you'll need to create/import it properly
import { generateVideoFromScenesHandler } from './final-text-to-video-caption-generator-7.js';

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
app.get('/api/generate-video', async (req, res) => {
  try {
    // Step 1: Get topic from query parameter
    const topic = req.query.topic;
    
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