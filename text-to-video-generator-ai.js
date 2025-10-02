// AI Video Generator API with Express.js
// Install: npm install express axios fluent-ffmpeg sharp multer cors dotenv

import express from 'express';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import ffmpegPath  from 'ffmpeg-static';
import ffprobePath  from 'ffprobe-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FFmpeg setup for Windows
// const ffmpegPath = require('ffmpeg-static');
// const ffprobePath = require('ffprobe-static').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const app = express();
app.use(express.json());
app.use(cors());
app.use('/videos', express.static('output'));

class AIVideoGenerator {
    constructor() {
        // Multiple free AI APIs (no key required)
        this.apis = {
            pollinations: 'https://image.pollinations.ai/prompt/',
            picsum: 'https://picsum.photos/', // Fallback
        };

        this.outputDir = './output';
        this.framesDir = './frames';

        // Supported aspect ratios
        this.aspectRatios = {
            '16:9': { width: 1920, height: 1080 },
            '9:16': { width: 1080, height: 1920 }, // Vertical/Mobile
            '1:1': { width: 1080, height: 1080 },  // Square/Instagram
            '4:3': { width: 1024, height: 768 },
            '21:9': { width: 2560, height: 1080 }, // Ultrawide
        };

        // Video styles presets
        this.stylePresets = {
            cinematic: 'cinematic lighting, film grain, anamorphic, depth of field',
            anime: 'anime style, vibrant colors, studio ghibli, detailed animation',
            realistic: 'photorealistic, 8k, ultra detailed, professional photography',
            artistic: 'oil painting, impressionist, brush strokes, artistic',
            cyberpunk: 'cyberpunk, neon lights, futuristic, sci-fi, dark atmosphere',
            fantasy: 'fantasy art, magical, ethereal, epic, detailed illustration',
            vintage: 'vintage film, retro, 1980s aesthetic, nostalgic',
            minimalist: 'minimalist, clean, simple, modern design',
            watercolor: 'watercolor painting, soft colors, artistic, dreamy',
            comic: 'comic book style, bold lines, pop art, vibrant'
        };

        [this.outputDir, this.framesDir].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });
    }

    /**
     * Calculate frames needed based on duration and FPS
     */
    calculateFrames(duration, fps) {
        return Math.ceil(duration * fps);
    }

    /**
     * Generate image using Pollinations API
     */
    async generateImage(prompt, style, seed, dimensions) {
        try {
            const fullPrompt = style ? `${prompt}, ${style}` : prompt;
            const encodedPrompt = encodeURIComponent(fullPrompt);

            let url = `${this.apis.pollinations}${encodedPrompt}`;
            url += `?seed=${seed}`;
            url += `&width=${dimensions.width}&height=${dimensions.height}`;
            url += `&nologo=true&enhance=true`;

            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            return Buffer.from(response.data);
        } catch (error) {
            console.error('Image generation error:', error.message);
            throw error;
        }
    }

    /**
     * Generate image sequence with smooth transitions
     */
    async generateImageSequence(basePrompt, frameCount, style, dimensions, transitionType) {
        console.log(`Generating ${frameCount} frames...`);
        const images = [];

        for (let i = 0; i < frameCount; i++) {
            try {
                const variation = this.getPromptVariation(basePrompt, i, frameCount, transitionType);
                const seed = Math.floor(Math.random() * 1000000);

                console.log(`[${i + 1}/${frameCount}] ${variation}`);

                const imageBuffer = await this.generateImage(variation, style, seed, dimensions);
                const framePath = path.join(this.framesDir, `frame_${String(i).padStart(4, '0')}.png`);

                await sharp(imageBuffer)
                    .resize(dimensions.width, dimensions.height, { fit: 'cover' })
                    .toFile(framePath);

                images.push(framePath);

                // Small delay between requests
                await this.delay(800);
            } catch (error) {
                console.error(`Frame ${i} failed:`, error.message);
            }
        }

        return images;
    }

    /**
     * Create prompt variations for smooth video transitions
     */
    getPromptVariation(basePrompt, index, total, type = 'smooth') {
        const progress = index / (total - 1);

        if (type === 'zoom') {
            const zoomLevels = ['extreme close-up', 'close-up', 'medium shot', 'wide shot', 'extreme wide shot'];
            const level = Math.floor(progress * (zoomLevels.length - 1));
            return `${zoomLevels[level]} of ${basePrompt}`;
        }

        if (type === 'pan') {
            const angles = ['left side', 'front left', 'center', 'front right', 'right side'];
            const angle = Math.floor(progress * (angles.length - 1));
            return `${angles[angle]} view of ${basePrompt}`;
        }

        if (type === 'time') {
            const times = ['dawn', 'morning', 'noon', 'afternoon', 'sunset', 'dusk', 'night'];
            const time = Math.floor(progress * (times.length - 1));
            return `${basePrompt} during ${times[time]}`;
        }

        // Default smooth transition
        const transitions = [
            'establishing shot of',
            'detailed view of',
            'cinematic angle of',
            'atmospheric scene of',
            'dynamic composition of',
            'artistic shot of',
            'dramatic view of',
            'beautiful scene of'
        ];

        const transIndex = Math.floor(progress * (transitions.length - 1));
        return `${transitions[transIndex]} ${basePrompt}`;
    }

    /**
     * Create video from image frames
     */
    async createVideoFromImages(imagePaths, outputName, fps, addMusic = false) {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(this.outputDir, outputName);
            console.log('\nCreating video...');

            const command = ffmpeg()
                .input(path.join(this.framesDir, 'frame_%04d.png'))
                .inputFPS(fps)
                .outputOptions([
                    '-c:v libx264',
                    '-pix_fmt yuv420p',
                    '-crf 23',
                    '-preset medium',
                    '-movflags +faststart' // For web streaming
                ]);

            // Add optional background music
            if (addMusic && fs.existsSync('./background-music.mp3')) {
                command
                    .input('./background-music.mp3')
                    .outputOptions(['-shortest', '-c:a aac', '-b:a 192k']);
            }

            command
                .output(outputPath)
                .on('progress', (progress) => {
                    if (progress.percent) {
                        console.log(`Processing: ${progress.percent.toFixed(2)}% done`);
                    }
                })
                .on('end', () => {
                    console.log(`✓ Video created: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err.message);
                    reject(err);
                })
                .run();
        });
    }

    /**
     * Main video generation function
     */
    async generateVideo(options = {}) {
        const {
            prompt = 'a beautiful landscape',
            style = 'cinematic',
            duration = 10,
            fps = 2,
            aspectRatio = '16:9',
            transition = 'smooth',
            addMusic = false,
            outputName = `video_${Date.now()}.mp4`
        } = options;

        // Validate inputs
        if (!this.aspectRatios[aspectRatio]) {
            throw new Error(`Invalid aspect ratio. Choose from: ${Object.keys(this.aspectRatios).join(', ')}`);
        }

        const dimensions = this.aspectRatios[aspectRatio];
        const frameCount = this.calculateFrames(duration, fps);
        const stylePrompt = this.stylePresets[style] || style;

        console.log('='.repeat(60));
        console.log('AI Video Generator');
        console.log('='.repeat(60));
        console.log(`Prompt: ${prompt}`);
        console.log(`Style: ${style}`);
        console.log(`Duration: ${duration}s`);
        console.log(`FPS: ${fps}`);
        console.log(`Frames: ${frameCount}`);
        console.log(`Aspect Ratio: ${aspectRatio} (${dimensions.width}x${dimensions.height})`);
        console.log(`Transition: ${transition}`);
        console.log('='.repeat(60) + '\n');

        try {
            this.cleanFrames();

            const images = await this.generateImageSequence(
                prompt,
                frameCount,
                stylePrompt,
                dimensions,
                transition
            );

            if (images.length === 0) {
                throw new Error('No images generated');
            }

            const videoPath = await this.createVideoFromImages(images, outputName, fps, addMusic);

            return {
                success: true,
                videoPath,
                fileName: outputName,
                duration,
                frameCount: images.length,
                fps,
                aspectRatio,
                dimensions
            };
        } catch (error) {
            console.error('Video generation failed:', error);
            throw error;
        }
    }

    cleanFrames() {
        if (fs.existsSync(this.framesDir)) {
            const files = fs.readdirSync(this.framesDir);
            files.forEach(file => {
                fs.unlinkSync(path.join(this.framesDir, file));
            });
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize generator
const generator = new AIVideoGenerator();

// ==================== API ENDPOINTS ====================

/**
 * POST /api/generate-video
 * Generate a video from text prompt
 */
app.post('/api/generate-video', async (req, res) => {
    try {
        const {
            prompt,
            style = 'cinematic',
            duration = 10,
            fps = 2,
            aspectRatio = '16:9',
            transition = 'smooth',
            addMusic = false
        } = req.body;

        // Validation
        if (!prompt) {
            return res.status(400).json({
                error: 'Prompt is required',
                example: { prompt: 'a dragon flying over mountains' }
            });
        }

        if (duration < 3 || duration > 60) {
            return res.status(400).json({
                error: 'Duration must be between 3 and 60 seconds'
            });
        }

        if (fps < 1 || fps > 10) {
            return res.status(400).json({
                error: 'FPS must be between 1 and 10'
            });
        }

        const result = await generator.generateVideo({
            prompt,
            style,
            duration,
            fps,
            aspectRatio,
            transition,
            addMusic,
            outputName: `video_${Date.now()}.mp4`
        });

        res.json({
            success: true,
            message: 'Video generated successfully',
            data: result,
            videoUrl: `/videos/${result.fileName}`
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            error: 'Video generation failed',
            details: error.message
        });
    }
});

/**
 * GET /api/styles
 * Get available style presets
 */
app.get('/api/styles', (req, res) => {
    res.json({
        styles: Object.keys(generator.stylePresets),
        descriptions: generator.stylePresets
    });
});

/**
 * GET /api/aspect-ratios
 * Get available aspect ratios
 */
app.get('/api/aspect-ratios', (req, res) => {
    res.json({
        aspectRatios: generator.aspectRatios
    });
});

/**
 * GET /api/transitions
 * Get available transition types
 */
app.get('/api/transitions', (req, res) => {
    res.json({
        transitions: ['smooth', 'zoom', 'pan', 'time'],
        descriptions: {
            smooth: 'Smooth camera angle transitions',
            zoom: 'Zoom in/out effect',
            pan: 'Left to right panning',
            time: 'Time progression (dawn to night)'
        }
    });
});

/**
 * GET /api/features
 * Get all available features and input parameters
 */
app.get('/api/features', (req, res) => {
    res.json({
        endpoint: '/api/generate-video',
        method: 'POST',
        features: {
            prompt: {
                type: 'string',
                required: true,
                description: 'Text description of the video',
                example: 'a serene beach at sunset with waves'
            },
            style: {
                type: 'string',
                required: false,
                default: 'cinematic',
                options: Object.keys(generator.stylePresets),
                description: 'Visual style preset or custom style description'
            },
            duration: {
                type: 'number',
                required: false,
                default: 10,
                min: 3,
                max: 60,
                unit: 'seconds',
                description: 'Video duration in seconds'
            },
            fps: {
                type: 'number',
                required: false,
                default: 2,
                min: 1,
                max: 10,
                description: 'Frames per second (higher = smoother but slower generation)'
            },
            aspectRatio: {
                type: 'string',
                required: false,
                default: '16:9',
                options: Object.keys(generator.aspectRatios),
                description: 'Video aspect ratio',
                useCases: {
                    '16:9': 'YouTube, Landscape',
                    '9:16': 'TikTok, Instagram Stories',
                    '1:1': 'Instagram Posts',
                    '4:3': 'Classic TV',
                    '21:9': 'Cinematic Ultrawide'
                }
            },
            transition: {
                type: 'string',
                required: false,
                default: 'smooth',
                options: ['smooth', 'zoom', 'pan', 'time'],
                description: 'Type of transitions between frames'
            },
            addMusic: {
                type: 'boolean',
                required: false,
                default: false,
                description: 'Add background music (requires background-music.mp3 file)'
            }
        },
        examples: [
            {
                basic: {
                    prompt: 'a peaceful forest with morning sunlight'
                }
            },
            {
                advanced: {
                    prompt: 'futuristic city with flying cars',
                    style: 'cyberpunk',
                    duration: 15,
                    fps: 3,
                    aspectRatio: '16:9',
                    transition: 'zoom',
                    addMusic: false
                }
            },
            {
                mobile: {
                    prompt: 'fashion model walking on runway',
                    style: 'cinematic',
                    duration: 8,
                    fps: 2,
                    aspectRatio: '9:16',
                    transition: 'smooth'
                }
            }
        ]
    });
});

/**
 * GET /
 * API Documentation
 */
app.get('/', (req, res) => {
    res.json({
        message: 'AI Video Generator API',
        version: '1.0.0',
        documentation: {
            generateVideo: 'POST /api/generate-video',
            getStyles: 'GET /api/styles',
            getAspectRatios: 'GET /api/aspect-ratios',
            getTransitions: 'GET /api/transitions',
            getFeatures: 'GET /api/features'
        },
        quickStart: {
            curl: `curl -X POST http://localhost:3000/api/generate-video \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "a dragon flying over mountains",
    "style": "fantasy",
    "duration": 10,
    "fps": 2,
    "aspectRatio": "16:9"
  }'`
        }
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 AI Video Generator API running on port ${PORT}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n📚 Documentation: http://localhost:${PORT}/`);
    console.log(`📊 Features: http://localhost:${PORT}/api/features`);
    console.log(`🎨 Styles: http://localhost:${PORT}/api/styles`);
    console.log(`\n${'='.repeat(60)}\n`);
});
// module.exports = app;







// myinput prompt => excellet, now you can feed this all login in api integradated and as well as you can show some note for that how to use that api and what value should pass with the example of api and thier value pass and as well as should take one more input for how  much second of video do you want to video need to generate and their ratio of video too, and even show how many input feature can i give into them.

// AI Video Generator from Text Prompts
// Code ∙ Version 2
// Perfect! I've created a complete API-integrated video generator with full documentation. Here's everything you need:

// 📦 Installation
// bash
// npm install express axios fluent-ffmpeg sharp multer cors dotenv
// 🚀 Quick Start
// Start the server:
// bash
// node video-generator.js
// Server runs on: http://localhost:3000
// 📚 API Documentation
// Main Endpoint: Generate Video
// POST /api/generate-video

// bash
// curl -X POST http://localhost:3000/api/generate-video \
//   -H "Content-Type: application/json" \
//   -d '{
//     "prompt": "a dragon flying over mountains",
//     "style": "fantasy",
//     "duration": 15,
//     "fps": 3,
//     "aspectRatio": "16:9",
//     "transition": "zoom"
//   }'

// 🎯 All Input Features:
// Parameter	Type	Required	Default	Description
// prompt	    string	✅ Yes	-	Text description of video
// style	    string	❌ No	"cinematic"	Visual style preset
// duration	    number	❌ No	10	Video length (3-60 seconds)
// fps	        number	❌ No	2	Frames per second (1-10)
// aspectRatio	string	❌ No	"16:9"	Video dimensions
// transition	string	❌ No	"smooth"	Transition effect type
// addMusic 	boolean	❌ No	false	Add background music

// 🎨 Available Styles:
// javascript
// GET /api/styles

// // Returns: see differnce of styles in https://chatgpt.com/s/m_68de212c82988191a2ee3342dc7e962a
// {
//   "cinematic": "Film-like, professional",
//   "anime": "Japanese animation style",
//   "realistic": "Photorealistic 8K",
//   "artistic": "Oil painting, impressionist",
//   "cyberpunk": "Neon, futuristic sci-fi",
//   "fantasy": "Magical, epic fantasy art",
//   "vintage": "1980s retro aesthetic",
//   "minimalist": "Clean, modern design",
//   "watercolor": "Soft artistic painting",
//   "comic": "Comic book pop art"
// }
// 📐 Aspect Ratios:
// javascript
// GET /api/aspect-ratios

// {
//   "16:9": { "width": 1920, "height": 1080 },  // YouTube, Landscape
//   "9:16": { "width": 1080, "height": 1920 },  // TikTok, Stories
//   "1:1": { "width": 1080, "height": 1080 },   // Instagram Square
//   "4:3": { "width": 1024, "height": 768 },    // Classic TV
//   "21:9": { "width": 2560, "height": 1080 }   // Ultrawide Cinema
// }
// 🎬 Transition Types:
// javascript
// GET /api/transitions

// {
//   "smooth": "Camera angle variations",
//   "zoom": "Zoom in/out effect",
//   "pan": "Left-to-right panning",
//   "time": "Dawn to night progression"
// }
// 💡 Example API Calls:
// 1. Simple Video (Minimal Parameters):
// javascript
// POST /api/generate-video
// {
//   "prompt": "sunset over ocean waves"
// }
// // Uses all defaults: 10s, cinematic, 16:9, 2fps
// 2. YouTube Video (Landscape):
// javascript
// {
//   "prompt": "chef cooking in modern kitchen",
//   "style": "realistic",
//   "duration": 20,
//   "fps": 3,
//   "aspectRatio": "16:9",
//   "transition": "smooth"
// }
// 3. TikTok/Instagram Story (Vertical):
// javascript
// {
//   "prompt": "fashion model on runway",
//   "style": "cinematic",
//   "duration": 8,
//   "fps": 2,
//   "aspectRatio": "9:16",
//   "transition": "zoom"
// }
// 4. Instagram Post (Square):
// javascript
// {
//   "prompt": "delicious food platter",
//   "style": "artistic",
//   "duration": 6,
//   "fps": 2,
//   "aspectRatio": "1:1",
//   "transition": "pan"
// }
// 5. Epic Fantasy Scene:
// javascript
// {
//   "prompt": "dragon battle in stormy sky",
//   "style": "fantasy",
//   "duration": 30,
//   "fps": 4,
//   "aspectRatio": "21:9",
//   "transition": "time"
// }


// 📊 Get All Features:
// bash
// GET /api/features
// Returns complete documentation of all parameters, examples, and use cases.


// ⚙️ Response Format:
// json
// {
//   "success": true,
//   "message": "Video generated successfully",
//   "data": {
//     "videoPath": "./output/video_1234567890.mp4",
//     "fileName": "video_1234567890.mp4",
//     "duration": 15,
//     "frameCount": 45,
//     "fps": 3,
//     "aspectRatio": "16:9",
//     "dimensions": { "width": 1920, "height": 1080 }
//   },
//   "videoUrl": "/videos/video_1234567890.mp4"
// }
// 🎵 Adding Background Music (Optional):
// Place background-music.mp3 in root directory, then:

// javascript
// {
//   "prompt": "your video description",
//   "addMusic": true
// }

// 💪 Pro Tips:
// Longer videos: Higher duration = more frames = longer generation time
// Smooth playback: FPS 2-3 is optimal for AI-generated videos
// Best quality: Use "realistic" or "cinematic" styles
// Fast generation: Use duration 5-10s, fps 2
// Social media: Use appropriate aspect ratios for each platform
// The API uses Pollinations.ai (free, unlimited) so you can generate 100+ videos daily! 🚀


// ===========================================================================================
// ===========================================================================================
// ===========================================================================================
// ===========================================================================================
// ===========================================================================================
// ===========================GOT ERROR FOR FFMPEG NOT FOUND==================================
// ===========================================================================================
// ===========================================================================================
// ===========================================================================================
// ===========================================================================================
// ===========================================================================================
// Solution

// step 1 install package
// 🔧 Quick Fix - Install FFmpeg via NPM (Easiest for Windows)
// bashnpm install ffmpeg-static ffprobe-static

// step 2 then add the following code to your script:
// import ffmpeg from 'ffmpeg-static';
// import ffprobe from 'ffprobe-static';