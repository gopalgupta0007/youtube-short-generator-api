// AI Video Generator API with Captions Support
// Install: npm install express axios fluent-ffmpeg sharp multer cors dotenv

import express from 'express';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const app = express();
app.use(express.json());
app.use(cors());
app.use('/videos', express.static('output'));

class AIVideoGenerator {
    constructor() {
        this.apis = {
            pollinations: 'https://image.pollinations.ai/prompt/',
            picsum: 'https://picsum.photos/',
        };

        this.outputDir = './output';
        this.framesDir = './frames';

        this.aspectRatios = {
            '16:9': { width: 1920, height: 1080 },
            '9:16': { width: 1080, height: 1920 },
            '1:1': { width: 1080, height: 1080 },
            '4:3': { width: 1024, height: 768 },
            '21:9': { width: 2560, height: 1080 },
        };

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

        // Caption style presets
        this.captionStyles = {
            default: {
                fontsize: 48,
                fontcolor: 'white',
                borderw: 3,
                bordercolor: 'black',
                position: 'bottom',
                fontfile: '' // Will use system default
            },
            bold: {
                fontsize: 60,
                fontcolor: 'white',
                borderw: 4,
                bordercolor: 'black',
                position: 'bottom',
                fontfile: ''
            },
            subtitle: {
                fontsize: 40,
                fontcolor: 'white',
                borderw: 2,
                bordercolor: 'black',
                position: 'bottom',
                box: true,
                boxcolor: 'black@0.5',
                fontfile: ''
            },
            title: {
                fontsize: 72,
                fontcolor: 'yellow',
                borderw: 5,
                bordercolor: 'black',
                position: 'top',
                fontfile: ''
            },
            minimal: {
                fontsize: 36,
                fontcolor: 'white',
                borderw: 0,
                position: 'bottom',
                box: true,
                boxcolor: 'black@0.7',
                fontfile: ''
            }
        };

        [this.outputDir, this.framesDir].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });
    }

    calculateFrames(duration, fps) {
        return Math.ceil(duration * fps);
    }

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
                await this.delay(800);
            } catch (error) {
                console.error(`Frame ${i} failed:`, error.message);
            }
        }

        return images;
    }

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
     * Build FFmpeg filter for captions
     */
    buildCaptionFilter(caption, style, dimensions) {
        const captionStyle = this.captionStyles[style] || this.captionStyles.default;

        // Escape special characters for FFmpeg
        const escapedText = caption.replace(/'/g, "'\\''").replace(/:/g, '\\:');

        // Calculate position
        let x = '(w-text_w)/2'; // Center horizontally
        let y;

        if (captionStyle.position === 'top') {
            y = 'h*0.1'; // 10% from top
        } else if (captionStyle.position === 'middle') {
            y = '(h-text_h)/2'; // Center vertically
        } else { // bottom
            y = 'h-text_h-h*0.1'; // 10% from bottom
        }

        let filter = `drawtext=text='${escapedText}':`;
        filter += `fontsize=${captionStyle.fontsize}:`;
        filter += `fontcolor=${captionStyle.fontcolor}:`;
        filter += `x=${x}:y=${y}:`;

        if (captionStyle.borderw > 0) {
            filter += `borderw=${captionStyle.borderw}:`;
            filter += `bordercolor=${captionStyle.bordercolor}:`;
        }

        if (captionStyle.box) {
            filter += `box=1:boxcolor=${captionStyle.boxcolor}:`;
            filter += `boxborderw=20:`;
        }

        return filter;
    }

    /**
     * Build FFmpeg filter for timed captions (multiple captions with timing)
     */
    buildTimedCaptionFilters(captions, style, dimensions) {
        const filters = [];

        captions.forEach((caption, index) => {
            const captionStyle = this.captionStyles[style] || this.captionStyles.default;
            const escapedText = caption.text.replace(/'/g, "'\\''").replace(/:/g, '\\:');

            let x = '(w-text_w)/2';
            let y = captionStyle.position === 'top' ? 'h*0.1' : 'h-text_h-h*0.1';

            let filter = `drawtext=text='${escapedText}':`;
            filter += `fontsize=${captionStyle.fontsize}:`;
            filter += `fontcolor=${captionStyle.fontcolor}:`;
            filter += `x=${x}:y=${y}:`;
            filter += `enable='between(t,${caption.start},${caption.end})':`;

            if (captionStyle.borderw > 0) {
                filter += `borderw=${captionStyle.borderw}:`;
                filter += `bordercolor=${captionStyle.bordercolor}:`;
            }

            if (captionStyle.box) {
                filter += `box=1:boxcolor=${captionStyle.boxcolor}:`;
                filter += `boxborderw=20:`;
            }

            filters.push(filter);
        });

        return filters.join(',');
    }

    /**
     * Create video from images with optional captions
     */
    async createVideoFromImages(imagePaths, outputName, fps, options = {}) {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(this.outputDir, outputName);
            console.log('\nCreating video with captions...');

            const command = ffmpeg()
                .input(path.join(this.framesDir, 'frame_%04d.png'))
                .inputFPS(fps)
                .outputOptions([
                    '-c:v libx264',
                    '-pix_fmt yuv420p',
                    '-crf 23',
                    '-preset medium',
                    '-movflags +faststart'
                ]);

            // Add caption filters
            if (options.caption && options.caption.text) {
                const captionFilter = this.buildCaptionFilter(
                    options.caption.text,
                    options.caption.style || 'default',
                    options.dimensions
                );
                command.videoFilters(captionFilter);
            } else if (options.timedCaptions && options.timedCaptions.length > 0) {
                const timedFilters = this.buildTimedCaptionFilters(
                    options.timedCaptions,
                    options.captionStyle || 'default',
                    options.dimensions
                );
                command.videoFilters(timedFilters);
            }

            // Add background music
            if (options.addMusic && fs.existsSync('./background-music.mp3')) {
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
     * Main video generation function with caption support
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
            outputName = `video_${Date.now()}.mp4`,
            caption = null, // { text: 'Caption text', style: 'default' }
            timedCaptions = null, // [{ text: 'Caption 1', start: 0, end: 3 }, ...]
            captionStyle = 'default'
        } = options;

        if (!this.aspectRatios[aspectRatio]) {
            throw new Error(`Invalid aspect ratio. Choose from: ${Object.keys(this.aspectRatios).join(', ')}`);
        }

        const dimensions = this.aspectRatios[aspectRatio];
        const frameCount = this.calculateFrames(duration, fps);
        const stylePrompt = this.stylePresets[style] || style;

        console.log('='.repeat(60));
        console.log('AI Video Generator with Captions');
        console.log('='.repeat(60));
        console.log(`Prompt: ${prompt}`);
        console.log(`Style: ${style}`);
        console.log(`Duration: ${duration}s`);
        console.log(`FPS: ${fps}`);
        console.log(`Frames: ${frameCount}`);
        console.log(`Aspect Ratio: ${aspectRatio} (${dimensions.width}x${dimensions.height})`);
        console.log(`Transition: ${transition}`);
        if (caption) console.log(`Caption: "${caption.text}" (${caption.style || 'default'})`);
        if (timedCaptions) console.log(`Timed Captions: ${timedCaptions.length} captions`);
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

            const videoPath = await this.createVideoFromImages(images, outputName, fps, {
                addMusic,
                caption,
                timedCaptions,
                captionStyle,
                dimensions
            });

            return {
                success: true,
                videoPath,
                fileName: outputName,
                duration,
                frameCount: images.length,
                fps,
                aspectRatio,
                dimensions,
                hasCaption: !!(caption || timedCaptions)
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

const generator = new AIVideoGenerator();

// ==================== API ENDPOINTS ====================

/**
 * POST /api/generate-video
 * Generate a video with optional captions
 */
app.post('/api/generate-video', async (req, res) => {
    try {
        const {
            prompt,
            style = 'cinematic',
            duration = 10,
            fps = 2,
            aspectRatio = '9:16',
            transition = 'smooth',
            addMusic = false,
            caption = null,
            timedCaptions = null,
            captionStyle = 'title'
        } = req.body;

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

        // Validate timed captions
        if (timedCaptions && Array.isArray(timedCaptions)) {
            for (const tc of timedCaptions) {
                if (!tc.text || tc.start === undefined || tc.end === undefined) {
                    return res.status(400).json({
                        error: 'Each timed caption must have text, start, and end properties'
                    });
                }
                if (tc.start >= tc.end || tc.end > duration) {
                    return res.status(400).json({
                        error: 'Invalid caption timing'
                    });
                }
            }
        }

        const result = await generator.generateVideo({
            prompt,
            style,
            duration,
            fps,
            aspectRatio,
            transition,
            addMusic,
            caption,
            timedCaptions,
            captionStyle,
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
 * GET /api/caption-styles
 * Get available caption styles
 */
app.get('/api/caption-styles', (req, res) => {
    res.json({
        styles: Object.keys(generator.captionStyles),
        descriptions: generator.captionStyles
    });
});

app.get('/api/styles', (req, res) => {
    res.json({
        styles: Object.keys(generator.stylePresets),
        descriptions: generator.stylePresets
    });
});

app.get('/api/aspect-ratios', (req, res) => {
    res.json({
        aspectRatios: generator.aspectRatios
    });
});

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
                options: Object.keys(generator.stylePresets)
            },
            duration: {
                type: 'number',
                required: false,
                default: 10,
                min: 3,
                max: 60,
                unit: 'seconds'
            },
            fps: {
                type: 'number',
                required: false,
                default: 2,
                min: 1,
                max: 10
            },
            aspectRatio: {
                type: 'string',
                required: false,
                default: '16:9',
                options: Object.keys(generator.aspectRatios)
            },
            transition: {
                type: 'string',
                required: false,
                default: 'smooth',
                options: ['smooth', 'zoom', 'pan', 'time']
            },
            caption: {
                type: 'object',
                required: false,
                description: 'Single caption for entire video',
                properties: {
                    text: { type: 'string', required: true },
                    style: { type: 'string', required: false, options: Object.keys(generator.captionStyles) }
                },
                example: { text: 'My Amazing Video', style: 'bold' }
            },
            timedCaptions: {
                type: 'array',
                required: false,
                description: 'Multiple captions with specific timings',
                items: {
                    text: { type: 'string', required: true },
                    start: { type: 'number', required: true, description: 'Start time in seconds' },
                    end: { type: 'number', required: true, description: 'End time in seconds' }
                },
                example: [
                    { text: 'Introduction', start: 0, end: 3 },
                    { text: 'Main Content', start: 3, end: 7 },
                    { text: 'Conclusion', start: 7, end: 10 }
                ]
            },
            captionStyle: {
                type: 'string',
                required: false,
                default: 'default',
                options: Object.keys(generator.captionStyles),
                description: 'Style to apply to all captions'
            },
            addMusic: {
                type: 'boolean',
                required: false,
                default: false
            }
        },
        examples: [
            {
                basicWithCaption: {
                    prompt: 'a peaceful forest with morning sunlight',
                    caption: {
                        text: 'Nature at its finest',
                        style: 'default'
                    }
                }
            },
            {
                timedCaptions: {
                    prompt: 'futuristic city with flying cars',
                    style: 'cyberpunk',
                    duration: 15,
                    timedCaptions: [
                        { text: 'Welcome to 2077', start: 0, end: 5 },
                        { text: 'The Future is Now', start: 5, end: 10 },
                        { text: 'Subscribe for More', start: 10, end: 15 }
                    ],
                    captionStyle: 'bold'
                }
            }
        ]
    });
});

app.get('/', (req, res) => {
    res.json({
        message: 'AI Video Generator API with Captions',
        version: '2.0.0',
        documentation: {
            generateVideo: 'POST /api/generate-video',
            getStyles: 'GET /api/styles',
            getCaptionStyles: 'GET /api/caption-styles',
            getAspectRatios: 'GET /api/aspect-ratios',
            getTransitions: 'GET /api/transitions',
            getFeatures: 'GET /api/features'
        },
        captionFeatures: {
            singleCaption: 'Add one caption for entire video',
            timedCaptions: 'Add multiple captions with timing',
            customStyles: 'Choose from 5 caption styles',
            positioning: 'Top, middle, or bottom placement',
            customization: 'Font size, color, borders, backgrounds'
        },
        quickStart: {
            basicCaption: `curl -X POST http://localhost:3000/api/generate-video \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "a dragon flying over mountains",
    "style": "fantasy",
    "duration": 10,
    "caption": {
      "text": "Epic Dragon Flight",
      "style": "bold"
    }
  }'`,
            timedCaptions: `curl -X POST http://localhost:3000/api/generate-video \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "sunset over ocean",
    "duration": 15,
    "timedCaptions": [
      {"text": "Part 1", "start": 0, "end": 5},
      {"text": "Part 2", "start": 5, "end": 10},
      {"text": "The End", "start": 10, "end": 15}
    ],
    "captionStyle": "subtitle"
  }'`
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 AI Video Generator API with Captions on port ${PORT}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n📚 Documentation: http://localhost:${PORT}/`);
    console.log(`📊 Features: http://localhost:${PORT}/api/features`);
    console.log(`🎨 Styles: http://localhost:${PORT}/api/styles`);
    console.log(`💬 Caption Styles: http://localhost:${PORT}/api/caption-styles`);
    console.log(`\n${'='.repeat(60)}\n`);
});



// I've enhanced your AI Video Generator with comprehensive caption support! Here's what's new:
// ✨ New Caption Features
// 1. Single Caption (entire video)
// json{
//   "prompt": "a dragon flying over mountains",
//   "caption": {
//     "text": "Epic Dragon Flight",
//     "style": "bold"
//   }
// }
// 2. Timed Captions (multiple captions with timing)
// json{
//   "prompt": "sunset over ocean",
//   "duration": 15,
//   "timedCaptions": [
//     {"text": "Introduction", "start": 0, "end": 5},
//     {"text": "Main Scene", "start": 5, "end": 10},
//     {"text": "The End", "start": 10, "end": 15}
//   ],
//   "captionStyle": "subtitle"
// }
// 🎨 5 Caption Styles Available

// default - White text with black border
// bold - Larger text (60px) with thick border
// subtitle - Classic subtitle style with semi-transparent background box
// title - Large yellow text for titles (top position)
// minimal - Clean style with dark background box

// 🔧 Caption Customization Options
// Each style supports:

// Font size (36-72px)
// Colors (white, yellow, custom)
// Borders (thickness and color)
// Background boxes (optional with transparency)
// Position (top, middle, or bottom)

// 📡 New API Endpoint
// GET /api/caption-styles - View all available caption styles
// 💡 Usage Examples
// Test with curl:
// bash# Single caption
// curl -X POST http://localhost:3000/api/generate-video \
//   -H "Content-Type: application/json" \
//   -d '{
//     "prompt": "beautiful sunset",
//     "duration": 10,
//     "caption": {
//       "text": "Nature is Beautiful",
//       "style": "bold"
//     }
//   }'

// # Multiple timed captions
// curl -X POST http://localhost:3000/api/generate-video \
//   -H "Content-Type: application/json" \
//   -d '{
//     "prompt": "city timelapse",
//     "duration": 12,
//     "timedCaptions": [
//       {"text": "Morning", "start": 0, "end": 4},
//       {"text": "Afternoon", "start": 4, "end": 8},
//       {"text": "Evening", "start": 8, "end": 12}
//     ],
//     "captionStyle": "subtitle"
//   }'
// The captions are burned directly into the video using FFmpeg's drawtext filter with proper text escaping, positioning, and styling!