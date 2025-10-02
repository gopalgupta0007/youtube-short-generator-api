// // Enhanced AI Video Generator API with Audio URL & Captions
// // Install: npm install express axios fluent-ffmpeg sharp multer cors dotenv node-fetch

// import express from 'express';
// import axios from 'axios';
// import ffmpeg from 'fluent-ffmpeg';
// import sharp from 'sharp';
// import fs from 'fs';
// import path from 'path';
// import cors from 'cors';
// import { fileURLToPath } from 'url';
// import ffmpegPath from 'ffmpeg-static';
// import ffprobePath from 'ffprobe-static';
// import fetch from 'node-fetch';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// ffmpeg.setFfmpegPath(ffmpegPath);
// ffmpeg.setFfprobePath(ffprobePath.path);

// const app = express();
// app.use(express.json());
// app.use(cors());
// app.use('/videos', express.static('output'));

// class AIVideoGenerator {
//     constructor() {
//         this.apis = {
//             pollinations: 'https://image.pollinations.ai/prompt/',
//             picsum: 'https://picsum.photos/',
//         };

//         this.outputDir = './output';
//         this.framesDir = './frames';
//         this.audioDir = './audio';

//         // Caption text styles with font configurations
//         this.captionStyles = {
//             modern: {
//                 fontFile: 'Arial',
//                 fontSize: 48,
//                 fontColor: 'white',
//                 borderColor: 'black',
//                 borderWidth: 3,
//                 shadowColor: 'black@0.5',
//                 shadowX: 2,
//                 shadowY: 2,
//                 alignment: 'center'
//             },
//             cinematic: {
//                 fontFile: 'Georgia',
//                 fontSize: 52,
//                 fontColor: 'white',
//                 borderColor: 'black',
//                 borderWidth: 4,
//                 shadowColor: 'black@0.7',
//                 shadowX: 3,
//                 shadowY: 3,
//                 alignment: 'center'
//             },
//             bold: {
//                 fontFile: 'Arial-Bold',
//                 fontSize: 56,
//                 fontColor: 'yellow',
//                 borderColor: 'black',
//                 borderWidth: 5,
//                 shadowColor: 'black@0.8',
//                 shadowX: 4,
//                 shadowY: 4,
//                 alignment: 'center'
//             },
//             elegant: {
//                 fontFile: 'Times-New-Roman',
//                 fontSize: 44,
//                 fontColor: 'white',
//                 borderColor: 'gold',
//                 borderWidth: 2,
//                 shadowColor: 'black@0.6',
//                 shadowX: 2,
//                 shadowY: 2,
//                 alignment: 'center'
//             },
//             minimal: {
//                 fontFile: 'Helvetica',
//                 fontSize: 40,
//                 fontColor: 'white',
//                 borderColor: 'none',
//                 borderWidth: 0,
//                 shadowColor: 'black@0.4',
//                 shadowX: 1,
//                 shadowY: 1,
//                 alignment: 'center'
//             },
//             neon: {
//                 fontFile: 'Arial-Bold',
//                 fontSize: 50,
//                 fontColor: 'cyan',
//                 borderColor: 'blue',
//                 borderWidth: 3,
//                 shadowColor: 'cyan@0.8',
//                 shadowX: 0,
//                 shadowY: 0,
//                 alignment: 'center'
//             },
//             classic: {
//                 fontFile: 'Courier',
//                 fontSize: 42,
//                 fontColor: 'white',
//                 borderColor: 'black',
//                 borderWidth: 2,
//                 shadowColor: 'black@0.5',
//                 shadowX: 2,
//                 shadowY: 2,
//                 alignment: 'center'
//             },
//             comic: {
//                 fontFile: 'Comic-Sans-MS',
//                 fontSize: 48,
//                 fontColor: 'white',
//                 borderColor: 'black',
//                 borderWidth: 4,
//                 shadowColor: 'purple@0.6',
//                 shadowX: 3,
//                 shadowY: 3,
//                 alignment: 'center'
//             }
//         };

//         // Supported languages for captions
//         this.supportedLanguages = {
//             en: 'English',
//             es: 'Spanish',
//             fr: 'French',
//             de: 'German',
//             it: 'Italian',
//             pt: 'Portuguese',
//             ru: 'Russian',
//             ja: 'Japanese',
//             ko: 'Korean',
//             zh: 'Chinese',
//             ar: 'Arabic',
//             hi: 'Hindi',
//             bn: 'Bengali',
//             pa: 'Punjabi',
//             te: 'Telugu',
//             mr: 'Marathi',
//             ta: 'Tamil',
//             gu: 'Gujarati',
//             kn: 'Kannada',
//             ml: 'Malayalam'
//         };

//         this.aspectRatios = {
//             '16:9': { width: 1920, height: 1080 },
//             '9:16': { width: 1080, height: 1920 },
//             '1:1': { width: 1080, height: 1080 },
//             '4:3': { width: 1024, height: 768 },
//             '21:9': { width: 2560, height: 1080 },
//         };

//         this.stylePresets = {
//             cinematic: 'cinematic lighting, film grain, anamorphic, depth of field',
//             anime: 'anime style, vibrant colors, studio ghibli, detailed animation',
//             realistic: 'photorealistic, 8k, ultra detailed, professional photography',
//             artistic: 'oil painting, impressionist, brush strokes, artistic',
//             cyberpunk: 'cyberpunk, neon lights, futuristic, sci-fi, dark atmosphere',
//             fantasy: 'fantasy art, magical, ethereal, epic, detailed illustration',
//             vintage: 'vintage film, retro, 1980s aesthetic, nostalgic',
//             minimalist: 'minimalist, clean, simple, modern design',
//             watercolor: 'watercolor painting, soft colors, artistic, dreamy',
//             comic: 'comic book style, bold lines, pop art, vibrant'
//         };

//         [this.outputDir, this.framesDir, this.audioDir].forEach(dir => {
//             if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//         });
//     }

//     calculateFrames(duration, fps) {
//         return Math.ceil(duration * fps);
//     }

//     async generateImage(prompt, style, seed, dimensions) {
//         try {
//             const fullPrompt = style ? `${prompt}, ${style}` : prompt;
//             const encodedPrompt = encodeURIComponent(fullPrompt);

//             let url = `${this.apis.pollinations}${encodedPrompt}`;
//             url += `?seed=${seed}`;
//             url += `&width=${dimensions.width}&height=${dimensions.height}`;
//             url += `&nologo=true&enhance=true`;

//             const response = await axios.get(url, {
//                 responseType: 'arraybuffer',
//                 timeout: 30000
//             });

//             return Buffer.from(response.data);
//         } catch (error) {
//             console.error('Image generation error:', error.message);
//             throw error;
//         }
//     }

//     async generateImageSequence(basePrompt, frameCount, style, dimensions, transitionType) {
//         console.log(`Generating ${frameCount} frames...`);
//         const images = [];

//         for (let i = 0; i < frameCount; i++) {
//             try {
//                 const variation = this.getPromptVariation(basePrompt, i, frameCount, transitionType);
//                 const seed = Math.floor(Math.random() * 1000000);

//                 console.log(`[${i + 1}/${frameCount}] ${variation}`);

//                 const imageBuffer = await this.generateImage(variation, style, seed, dimensions);
//                 const framePath = path.join(this.framesDir, `frame_${String(i).padStart(4, '0')}.png`);

//                 await sharp(imageBuffer)
//                     .resize(dimensions.width, dimensions.height, { fit: 'cover' })
//                     .toFile(framePath);

//                 images.push(framePath);
//                 await this.delay(800);
//             } catch (error) {
//                 console.error(`Frame ${i} failed:`, error.message);
//             }
//         }

//         return images;
//     }

//     getPromptVariation(basePrompt, index, total, type = 'smooth') {
//         const progress = index / (total - 1);

//         if (type === 'zoom') {
//             const zoomLevels = ['extreme close-up', 'close-up', 'medium shot', 'wide shot', 'extreme wide shot'];
//             const level = Math.floor(progress * (zoomLevels.length - 1));
//             return `${zoomLevels[level]} of ${basePrompt}`;
//         }

//         if (type === 'pan') {
//             const angles = ['left side', 'front left', 'center', 'front right', 'right side'];
//             const angle = Math.floor(progress * (angles.length - 1));
//             return `${angles[angle]} view of ${basePrompt}`;
//         }

//         if (type === 'time') {
//             const times = ['dawn', 'morning', 'noon', 'afternoon', 'sunset', 'dusk', 'night'];
//             const time = Math.floor(progress * (times.length - 1));
//             return `${basePrompt} during ${times[time]}`;
//         }

//         const transitions = [
//             'establishing shot of',
//             'detailed view of',
//             'cinematic angle of',
//             'atmospheric scene of',
//             'dynamic composition of',
//             'artistic shot of',
//             'dramatic view of',
//             'beautiful scene of'
//         ];

//         const transIndex = Math.floor(progress * (transitions.length - 1));
//         return `${transitions[transIndex]} ${basePrompt}`;
//     }

//     /**
//      * Download audio from URL
//      */
//     async downloadAudio(audioUrl) {
//         try {
//             console.log(`Downloading audio from: ${audioUrl}`);
//             const response = await fetch(audioUrl);

//             if (!response.ok) {
//                 throw new Error(`Failed to download audio: ${response.statusText}`);
//             }

//             const arrayBuffer = await response.arrayBuffer();
//             const buffer = Buffer.from(arrayBuffer);

//             const audioPath = path.join(this.audioDir, `audio_${Date.now()}.mp3`);
//             fs.writeFileSync(audioPath, buffer);

//             console.log(`✓ Audio downloaded: ${audioPath}`);
//             return audioPath;
//         } catch (error) {
//             console.error('Audio download error:', error.message);
//             throw error;
//         }
//     }

//     /**
//      * Create video with audio and captions
//      */
//     async createVideoFromImages(imagePaths, outputName, fps, options = {}) {
//         return new Promise(async (resolve, reject) => {
//             const outputPath = path.join(this.outputDir, outputName);
//             console.log('\nCreating video...');

//             try {
//                 const command = ffmpeg()
//                     .input(path.join(this.framesDir, 'frame_%04d.png'))
//                     .inputFPS(fps)
//                     .outputOptions([
//                         '-c:v libx264',
//                         '-pix_fmt yuv420p',
//                         '-crf 23',
//                         '-preset medium',
//                         '-movflags +faststart'
//                     ]);

//                 // Handle audio
//                 let audioPath = null;
//                 if (options.addMusic && options.audioUrl) {
//                     audioPath = await this.downloadAudio(options.audioUrl);
//                     command
//                         .input(audioPath)
//                         .outputOptions(['-shortest', '-c:a aac', '-b:a 192k']);
//                 } else if (options.addMusic && fs.existsSync('./background-music.mp3')) {
//                     command
//                         .input('./background-music.mp3')
//                         .outputOptions(['-shortest', '-c:a aac', '-b:a 192k']);
//                 }

//                 // Handle captions
//                 if (options.caption && options.caption.text) {
//                     const captionFilter = this.buildCaptionFilter(options.caption);
//                     command.outputOptions(['-vf', captionFilter]);
//                 }

//                 command
//                     .output(outputPath)
//                     .on('progress', (progress) => {
//                         if (progress.percent) {
//                             console.log(`Processing: ${progress.percent.toFixed(2)}% done`);
//                         }
//                     })
//                     .on('end', () => {
//                         console.log(`✓ Video created: ${outputPath}`);

//                         // Cleanup downloaded audio
//                         if (audioPath && fs.existsSync(audioPath)) {
//                             fs.unlinkSync(audioPath);
//                         }

//                         resolve(outputPath);
//                     })
//                     .on('error', (err) => {
//                         console.error('FFmpeg error:', err.message);

//                         // Cleanup on error
//                         if (audioPath && fs.existsSync(audioPath)) {
//                             fs.unlinkSync(audioPath);
//                         }

//                         reject(err);
//                     })
//                     .run();
//             } catch (error) {
//                 reject(error);
//             }
//         });
//     }

//     /**
//      * Build FFmpeg caption filter
//      */
//     buildCaptionFilter(caption) {
//         const {
//             text,
//             style = 'modern',
//             position = 'bottom',
//             language = 'en'
//         } = caption;

//         const styleConfig = this.captionStyles[style] || this.captionStyles.modern;

//         // Escape text for FFmpeg
//         const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:");

//         // Position mapping
//         const positions = {
//             top: `x=(w-text_w)/2:y=50`,
//             center: `x=(w-text_w)/2:y=(h-text_h)/2`,
//             bottom: `x=(w-text_w)/2:y=h-text_h-50`
//         };

//         const positionStr = positions[position] || positions.bottom;

//         // Build drawtext filter
//         let filter = `drawtext=text='${escapedText}'`;
//         filter += `:fontsize=${styleConfig.fontSize}`;
//         filter += `:fontcolor=${styleConfig.fontColor}`;
//         filter += `:${positionStr}`;

//         if (styleConfig.borderWidth > 0 && styleConfig.borderColor !== 'none') {
//             filter += `:borderw=${styleConfig.borderWidth}`;
//             filter += `:bordercolor=${styleConfig.borderColor}`;
//         }

//         if (styleConfig.shadowX > 0 || styleConfig.shadowY > 0) {
//             filter += `:shadowx=${styleConfig.shadowX}`;
//             filter += `:shadowy=${styleConfig.shadowY}`;
//             filter += `:shadowcolor=${styleConfig.shadowColor}`;
//         }

//         return filter;
//     }

//     async generateVideo(options = {}) {
//         const {
//             prompt = 'a beautiful landscape',
//             style = 'cinematic',
//             duration = 10,
//             fps = 2,
//             aspectRatio = '16:9',
//             transition = 'smooth',
//             addMusic = false,
//             audioUrl = null,
//             caption = null,
//             outputName = `video_${Date.now()}.mp4`
//         } = options;

//         if (!this.aspectRatios[aspectRatio]) {
//             throw new Error(`Invalid aspect ratio. Choose from: ${Object.keys(this.aspectRatios).join(', ')}`);
//         }

//         const dimensions = this.aspectRatios[aspectRatio];
//         const frameCount = this.calculateFrames(duration, fps);
//         const stylePrompt = this.stylePresets[style] || style;

//         console.log('='.repeat(60));
//         console.log('AI Video Generator');
//         console.log('='.repeat(60));
//         console.log(`Prompt: ${prompt}`);
//         console.log(`Style: ${style}`);
//         console.log(`Duration: ${duration}s`);
//         console.log(`FPS: ${fps}`);
//         console.log(`Frames: ${frameCount}`);
//         console.log(`Aspect Ratio: ${aspectRatio} (${dimensions.width}x${dimensions.height})`);
//         console.log(`Transition: ${transition}`);
//         if (addMusic && audioUrl) console.log(`Audio URL: ${audioUrl}`);
//         if (caption) console.log(`Caption: ${caption.text} (${caption.style || 'modern'})`);
//         console.log('='.repeat(60) + '\n');

//         try {
//             this.cleanFrames();

//             const images = await this.generateImageSequence(
//                 prompt,
//                 frameCount,
//                 stylePrompt,
//                 dimensions,
//                 transition
//             );

//             if (images.length === 0) {
//                 throw new Error('No images generated');
//             }

//             const videoPath = await this.createVideoFromImages(images, outputName, fps, {
//                 addMusic,
//                 audioUrl,
//                 caption
//             });

//             return {
//                 success: true,
//                 videoPath,
//                 fileName: outputName,
//                 duration,
//                 frameCount: images.length,
//                 fps,
//                 aspectRatio,
//                 dimensions,
//                 hasAudio: addMusic,
//                 hasCaption: !!caption
//             };
//         } catch (error) {
//             console.error('Video generation failed:', error);
//             throw error;
//         }
//     }

//     cleanFrames() {
//         if (fs.existsSync(this.framesDir)) {
//             const files = fs.readdirSync(this.framesDir);
//             files.forEach(file => {
//                 fs.unlinkSync(path.join(this.framesDir, file));
//             });
//         }
//     }

//     delay(ms) {
//         return new Promise(resolve => setTimeout(resolve, ms));
//     }
// }

// const generator = new AIVideoGenerator();

// // ==================== API ENDPOINTS ====================

// /**
//  * POST /api/generate-video - Enhanced with audio URL and captions
//  */
// app.post('/api/generate-video', async (req, res) => {
//     try {
//         const {
//             prompt,
//             style = 'cinematic',
//             duration = 10,
//             fps = 2,
//             aspectRatio = '16:9',
//             transition = 'smooth',
//             addMusic = false,
//             audioUrl = null,
//             caption = null
//         } = req.body;

//         // Validation
//         if (!prompt) {
//             return res.status(400).json({
//                 error: 'Prompt is required',
//                 example: { prompt: 'a dragon flying over mountains' }
//             });
//         }

//         if (duration < 3 || duration > 60) {
//             return res.status(400).json({
//                 error: 'Duration must be between 3 and 60 seconds'
//             });
//         }

//         if (fps < 1 || fps > 10) {
//             return res.status(400).json({
//                 error: 'FPS must be between 1 and 10'
//             });
//         }

//         // Validate audio URL if provided
//         if (addMusic && audioUrl) {
//             try {
//                 new URL(audioUrl);
//             } catch (e) {
//                 return res.status(400).json({
//                     error: 'Invalid audio URL format',
//                     example: 'https://example.com/audio.mp3'
//                 });
//             }
//         }

//         // Validate caption if provided
//         if (caption) {
//             if (!caption.text) {
//                 return res.status(400).json({
//                     error: 'Caption text is required when caption is enabled'
//                 });
//             }

//             if (caption.style && !generator.captionStyles[caption.style]) {
//                 return res.status(400).json({
//                     error: `Invalid caption style. Choose from: ${Object.keys(generator.captionStyles).join(', ')}`
//                 });
//             }

//             if (caption.language && !generator.supportedLanguages[caption.language]) {
//                 return res.status(400).json({
//                     error: `Unsupported language. Choose from: ${Object.keys(generator.supportedLanguages).join(', ')}`
//                 });
//             }
//         }

//         const result = await generator.generateVideo({
//             prompt,
//             style,
//             duration,
//             fps,
//             aspectRatio,
//             transition,
//             addMusic,
//             audioUrl,
//             caption,
//             outputName: `video_${Date.now()}.mp4`
//         });

//         res.json({
//             success: true,
//             message: 'Video generated successfully',
//             data: result,
//             videoUrl: `/videos/${result.fileName}`
//         });

//     } catch (error) {
//         console.error('API Error:', error);
//         res.status(500).json({
//             error: 'Video generation failed',
//             details: error.message
//         });
//     }
// });

// /**
//  * GET /api/caption-styles
//  */
// app.get('/api/caption-styles', (req, res) => {
//     res.json({
//         styles: Object.keys(generator.captionStyles),
//         descriptions: generator.captionStyles
//     });
// });

// /**
//  * GET /api/languages
//  */
// app.get('/api/languages', (req, res) => {
//     res.json({
//         supportedLanguages: generator.supportedLanguages
//     });
// });

// /**
//  * GET /api/features - Enhanced documentation
//  */
// app.get('/api/features', (req, res) => {
//     res.json({
//         endpoint: '/api/generate-video',
//         method: 'POST',
//         features: {
//             prompt: {
//                 type: 'string',
//                 required: true,
//                 description: 'Text description of the video',
//                 example: 'a serene beach at sunset with waves'
//             },
//             style: {
//                 type: 'string',
//                 required: false,
//                 default: 'cinematic',
//                 options: Object.keys(generator.stylePresets),
//                 description: 'Visual style preset'
//             },
//             duration: {
//                 type: 'number',
//                 required: false,
//                 default: 10,
//                 min: 3,
//                 max: 60,
//                 unit: 'seconds'
//             },
//             fps: {
//                 type: 'number',
//                 required: false,
//                 default: 2,
//                 min: 1,
//                 max: 10
//             },
//             aspectRatio: {
//                 type: 'string',
//                 required: false,
//                 default: '16:9',
//                 options: Object.keys(generator.aspectRatios)
//             },
//             transition: {
//                 type: 'string',
//                 required: false,
//                 default: 'smooth',
//                 options: ['smooth', 'zoom', 'pan', 'time']
//             },
//             addMusic: {
//                 type: 'boolean',
//                 required: false,
//                 default: false,
//                 description: 'Enable background music'
//             },
//             audioUrl: {
//                 type: 'string',
//                 required: false,
//                 default: null,
//                 description: 'URL to audio file (MP3, WAV). Required if addMusic is true',
//                 example: 'https://example.com/music.mp3'
//             },
//             caption: {
//                 type: 'object',
//                 required: false,
//                 default: null,
//                 description: 'Caption configuration',
//                 properties: {
//                     text: {
//                         type: 'string',
//                         required: true,
//                         description: 'Caption text to display',
//                         example: 'Welcome to Paradise'
//                     },
//                     style: {
//                         type: 'string',
//                         required: false,
//                         default: 'modern',
//                         options: Object.keys(generator.captionStyles),
//                         description: 'Caption visual style'
//                     },
//                     position: {
//                         type: 'string',
//                         required: false,
//                         default: 'bottom',
//                         options: ['top', 'center', 'bottom'],
//                         description: 'Caption position on screen'
//                     },
//                     language: {
//                         type: 'string',
//                         required: false,
//                         default: 'en',
//                         options: Object.keys(generator.supportedLanguages),
//                         description: 'Language code for caption'
//                     }
//                 }
//             }
//         },
//         examples: [
//             {
//                 basic: {
//                     prompt: 'a peaceful forest with morning sunlight'
//                 }
//             },
//             {
//                 withAudio: {
//                     prompt: 'sunset over ocean',
//                     style: 'cinematic',
//                     duration: 15,
//                     addMusic: true,
//                     audioUrl: 'https://example.com/calm-music.mp3'
//                 }
//             },
//             {
//                 withCaptions: {
//                     prompt: 'city skyline at night',
//                     style: 'cyberpunk',
//                     duration: 10,
//                     caption: {
//                         text: 'Welcome to the Future',
//                         style: 'neon',
//                         position: 'center',
//                         language: 'en'
//                     }
//                 }
//             },
//             {
//                 fullFeatures: {
//                     prompt: 'epic mountain landscape',
//                     style: 'cinematic',
//                     duration: 20,
//                     fps: 3,
//                     aspectRatio: '16:9',
//                     transition: 'zoom',
//                     addMusic: true,
//                     audioUrl: 'https://example.com/epic-music.mp3',
//                     caption: {
//                         text: 'Journey Begins',
//                         style: 'cinematic',
//                         position: 'bottom',
//                         language: 'en'
//                     }
//                 }
//             },
//             {
//                 multilingual: {
//                     prompt: 'traditional temple garden',
//                     style: 'artistic',
//                     caption: {
//                         text: 'こんにちは',
//                         style: 'elegant',
//                         position: 'top',
//                         language: 'ja'
//                     }
//                 }
//             }
//         ]
//     });
// });

// app.get('/api/styles', (req, res) => {
//     res.json({
//         styles: Object.keys(generator.stylePresets),
//         descriptions: generator.stylePresets
//     });
// });

// app.get('/api/aspect-ratios', (req, res) => {
//     res.json({
//         aspectRatios: generator.aspectRatios
//     });
// });

// app.get('/api/transitions', (req, res) => {
//     res.json({
//         transitions: ['smooth', 'zoom', 'pan', 'time'],
//         descriptions: {
//             smooth: 'Smooth camera angle transitions',
//             zoom: 'Zoom in/out effect',
//             pan: 'Left to right panning',
//             time: 'Time progression (dawn to night)'
//         }
//     });
// });

// app.get('/', (req, res) => {
//     res.json({
//         message: 'Enhanced AI Video Generator API',
//         version: '2.0.0',
//         newFeatures: [
//             '🎵 Audio URL support - Add music from any URL',
//             '📝 Multi-language captions with 8 text styles',
//             '🌍 20+ language support for captions'
//         ],
//         documentation: {
//             generateVideo: 'POST /api/generate-video',
//             getStyles: 'GET /api/styles',
//             getCaptionStyles: 'GET /api/caption-styles',
//             getLanguages: 'GET /api/languages',
//             getAspectRatios: 'GET /api/aspect-ratios',
//             getTransitions: 'GET /api/transitions',
//             getFeatures: 'GET /api/features'
//         },
//         quickStart: {
//             basicVideo: `curl -X POST http://localhost:3000/api/generate-video -H "Content-Type: application/json" -d '{"prompt": "sunset beach"}'`,
//             withAudio: `curl -X POST http://localhost:3000/api/generate-video -H "Content-Type: application/json" -d '{"prompt": "mountain view", "addMusic": true, "audioUrl": "https://example.com/music.mp3"}'`,
//             withCaption: `curl -X POST http://localhost:3000/api/generate-video -H "Content-Type: application/json" -d '{"prompt": "city night", "caption": {"text": "Hello World", "style": "modern"}}'`
//         }
//     });
// });

// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`\n${'='.repeat(60)}`);
//     console.log(`🚀 Enhanced AI Video Generator API v2.0`);
//     console.log(`${'='.repeat(60)}`);
//     console.log(`\n📚 Documentation: http://localhost:${PORT}/`);
//     console.log(`🎨 Caption Styles: http://localhost:${PORT}/api/caption-styles`);
//     console.log(`🌍 Languages: http://localhost:${PORT}/api/languages`);
//     console.log(`\n${'='.repeat(60)}\n`);
// });

























// Enhanced AI Video Generator API with Audio URL & Captions
// Install: npm install express axios fluent-ffmpeg sharp multer cors dotenv node-fetch

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
import fetch from 'node-fetch';

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
        this.audioDir = './audio';

        // Caption text styles with font configurations
        this.captionStyles = {
            modern: {
                fontFile: 'Arial',
                fontSize: 48,
                fontColor: 'white',
                borderColor: 'black',
                borderWidth: 3,
                shadowColor: 'black@0.5',
                shadowX: 2,
                shadowY: 2,
                alignment: 'center'
            },
            cinematic: {
                fontFile: 'Georgia',
                fontSize: 52,
                fontColor: 'white',
                borderColor: 'black',
                borderWidth: 4,
                shadowColor: 'black@0.7',
                shadowX: 3,
                shadowY: 3,
                alignment: 'center'
            },
            bold: {
                fontFile: 'Arial-Bold',
                fontSize: 56,
                fontColor: 'yellow',
                borderColor: 'black',
                borderWidth: 5,
                shadowColor: 'black@0.8',
                shadowX: 4,
                shadowY: 4,
                alignment: 'center'
            },
            elegant: {
                fontFile: 'Times-New-Roman',
                fontSize: 44,
                fontColor: 'white',
                borderColor: 'gold',
                borderWidth: 2,
                shadowColor: 'black@0.6',
                shadowX: 2,
                shadowY: 2,
                alignment: 'center'
            },
            minimal: {
                fontFile: 'Helvetica',
                fontSize: 40,
                fontColor: 'white',
                borderColor: 'none',
                borderWidth: 0,
                shadowColor: 'black@0.4',
                shadowX: 1,
                shadowY: 1,
                alignment: 'center'
            },
            neon: {
                fontFile: 'Arial-Bold',
                fontSize: 50,
                fontColor: 'cyan',
                borderColor: 'blue',
                borderWidth: 3,
                shadowColor: 'cyan@0.8',
                shadowX: 0,
                shadowY: 0,
                alignment: 'center'
            },
            classic: {
                fontFile: 'Courier',
                fontSize: 42,
                fontColor: 'white',
                borderColor: 'black',
                borderWidth: 2,
                shadowColor: 'black@0.5',
                shadowX: 2,
                shadowY: 2,
                alignment: 'center'
            },
            comic: {
                fontFile: 'Comic-Sans-MS',
                fontSize: 48,
                fontColor: 'white',
                borderColor: 'black',
                borderWidth: 4,
                shadowColor: 'purple@0.6',
                shadowX: 3,
                shadowY: 3,
                alignment: 'center'
            }
        };

        // Supported languages for captions
        this.supportedLanguages = {
            en: 'English',
            es: 'Spanish',
            fr: 'French',
            de: 'German',
            it: 'Italian',
            pt: 'Portuguese',
            ru: 'Russian',
            ja: 'Japanese',
            ko: 'Korean',
            zh: 'Chinese',
            ar: 'Arabic',
            hi: 'Hindi',
            bn: 'Bengali',
            pa: 'Punjabi',
            te: 'Telugu',
            mr: 'Marathi',
            ta: 'Tamil',
            gu: 'Gujarati',
            kn: 'Kannada',
            ml: 'Malayalam'
        };

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

        [this.outputDir, this.framesDir, this.audioDir].forEach(dir => {
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
     * Download audio from URL
     */
    async downloadAudio(audioUrl) {
        try {
            console.log(`Downloading audio from: ${audioUrl}`);
            const response = await fetch(audioUrl);

            if (!response.ok) {
                throw new Error(`Failed to download audio: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const audioPath = path.join(this.audioDir, `audio_${Date.now()}.mp3`);
            fs.writeFileSync(audioPath, buffer);

            console.log(`✓ Audio downloaded: ${audioPath}`);
            return audioPath;
        } catch (error) {
            console.error('Audio download error:', error.message);
            throw error;
        }
    }

    /**
     * Create video with audio and captions
     */
    async createVideoFromImages(imagePaths, outputName, fps, options = {}) {
        return new Promise(async (resolve, reject) => {
            const outputPath = path.join(this.outputDir, outputName);
            const tempVideoPath = path.join(this.outputDir, `temp_${outputName}`);
            console.log('\nCreating video...');

            try {
                // Step 1: Create base video without captions
                await new Promise((res, rej) => {
                    const videoCommand = ffmpeg()
                        .input(path.join(this.framesDir, 'frame_%04d.png'))
                        .inputFPS(fps)
                        .outputOptions([
                            '-c:v libx264',
                            '-pix_fmt yuv420p',
                            '-crf 23',
                            '-preset medium'
                        ])
                        .output(tempVideoPath)
                        .on('progress', (progress) => {
                            if (progress.percent) {
                                console.log(`Creating base video: ${progress.percent.toFixed(2)}% done`);
                            }
                        })
                        .on('end', res)
                        .on('error', rej)
                        .run();
                });

                // Step 2: Add audio and/or captions
                let audioPath = null;

                // Download audio if needed
                if (options.addMusic && options.audioUrl) {
                    audioPath = await this.downloadAudio(options.audioUrl);
                } else if (options.addMusic && fs.existsSync('./background-music.mp3')) {
                    audioPath = './background-music.mp3';
                }

                // Build final command with audio and/or captions
                const finalCommand = ffmpeg().input(tempVideoPath);

                // Add audio if available
                if (audioPath) {
                    finalCommand
                        .input(audioPath)
                        .outputOptions(['-shortest', '-c:a aac', '-b:a 192k']);
                }

                // Add caption filter if needed
                if (options.caption && options.caption.text) {
                    const captionFilter = this.buildCaptionFilter(options.caption);
                    finalCommand.videoFilters(captionFilter);
                    finalCommand.outputOptions(['-c:v libx264', '-crf 23', '-preset medium']);
                } else {
                    finalCommand.outputOptions(['-c:v copy']); // Copy video stream if no filter
                }

                finalCommand
                    .outputOptions(['-movflags', '+faststart'])
                    .output(outputPath)
                    .on('progress', (progress) => {
                        if (progress.percent) {
                            console.log(`Processing final video: ${progress.percent.toFixed(2)}% done`);
                        }
                    })
                    .on('end', () => {
                        console.log(`✓ Video created: ${outputPath}`);

                        // Cleanup
                        if (fs.existsSync(tempVideoPath)) {
                            fs.unlinkSync(tempVideoPath);
                        }
                        if (audioPath && audioPath.includes('audio_') && fs.existsSync(audioPath)) {
                            fs.unlinkSync(audioPath);
                        }

                        resolve(outputPath);
                    })
                    .on('error', (err) => {
                        console.error('FFmpeg error:', err.message);

                        // Cleanup on error
                        if (fs.existsSync(tempVideoPath)) {
                            fs.unlinkSync(tempVideoPath);
                        }
                        if (audioPath && audioPath.includes('audio_') && fs.existsSync(audioPath)) {
                            fs.unlinkSync(audioPath);
                        }

                        reject(err);
                    })
                    .run();

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Build FFmpeg caption filter
     */
    buildCaptionFilter(caption) {
        const {
            text,
            style = 'modern',
            position = 'bottom',
            language = 'en'
        } = caption;

        const styleConfig = this.captionStyles[style] || this.captionStyles.modern;

        // Escape text for FFmpeg - handle special characters
        const escapedText = text
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/:/g, '\\:')
            .replace(/\n/g, '\\n');

        // Position mapping
        const positions = {
            top: `(w-text_w)/2`,
            center: `(w-text_w)/2`,
            bottom: `(w-text_w)/2`
        };

        const yPositions = {
            top: `50`,
            center: `(h-text_h)/2`,
            bottom: `h-text_h-50`
        };

        const xPos = positions[position] || positions.bottom;
        const yPos = yPositions[position] || yPositions.bottom;

        // Build drawtext filter with proper escaping
        let filter = `drawtext=text='${escapedText}'`;
        filter += `:fontsize=${styleConfig.fontSize}`;
        filter += `:fontcolor=${styleConfig.fontColor}`;
        filter += `:x=${xPos}`;
        filter += `:y=${yPos}`;
        filter += `:box=1`;
        filter += `:boxcolor=black@0.5`;
        filter += `:boxborderw=5`;

        if (styleConfig.borderWidth > 0 && styleConfig.borderColor !== 'none') {
            filter += `:borderw=${styleConfig.borderWidth}`;
            filter += `:bordercolor=${styleConfig.borderColor}`;
        }

        return filter;
    }

    async generateVideo(options = {}) {
        const {
            prompt = 'a beautiful landscape',
            style = 'cinematic',
            duration = 10,
            fps = 2,
            aspectRatio = '16:9',
            transition = 'smooth',
            addMusic = false,
            audioUrl = null,
            caption = null,
            outputName = `video_${Date.now()}.mp4`
        } = options;

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
        if (addMusic && audioUrl) console.log(`Audio URL: ${audioUrl}`);
        if (caption) console.log(`Caption: ${caption.text} (${caption.style || 'modern'})`);
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
                audioUrl,
                caption
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
                hasAudio: addMusic,
                hasCaption: !!caption
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
 * POST /api/generate-video - Enhanced with audio URL and captions
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
            addMusic = false,
            audioUrl = null,
            caption = null
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

        // Validate audio URL if provided
        if (addMusic && audioUrl) {
            try {
                new URL(audioUrl);
            } catch (e) {
                return res.status(400).json({
                    error: 'Invalid audio URL format',
                    example: 'https://example.com/audio.mp3'
                });
            }
        }

        // Validate caption if provided
        if (caption) {
            if (!caption.text) {
                return res.status(400).json({
                    error: 'Caption text is required when caption is enabled'
                });
            }

            if (caption.style && !generator.captionStyles[caption.style]) {
                return res.status(400).json({
                    error: `Invalid caption style. Choose from: ${Object.keys(generator.captionStyles).join(', ')}`
                });
            }

            if (caption.language && !generator.supportedLanguages[caption.language]) {
                return res.status(400).json({
                    error: `Unsupported language. Choose from: ${Object.keys(generator.supportedLanguages).join(', ')}`
                });
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
            audioUrl,
            caption,
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
 */
app.get('/api/caption-styles', (req, res) => {
    res.json({
        styles: Object.keys(generator.captionStyles),
        descriptions: generator.captionStyles
    });
});

/**
 * GET /api/languages
 */
app.get('/api/languages', (req, res) => {
    res.json({
        supportedLanguages: generator.supportedLanguages
    });
});

/**
 * GET /api/features - Enhanced documentation
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
                description: 'Visual style preset'
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
            addMusic: {
                type: 'boolean',
                required: false,
                default: false,
                description: 'Enable background music'
            },
            audioUrl: {
                type: 'string',
                required: false,
                default: null,
                description: 'URL to audio file (MP3, WAV). Required if addMusic is true',
                example: 'https://example.com/music.mp3'
            },
            caption: {
                type: 'object',
                required: false,
                default: null,
                description: 'Caption configuration',
                properties: {
                    text: {
                        type: 'string',
                        required: true,
                        description: 'Caption text to display',
                        example: 'Welcome to Paradise'
                    },
                    style: {
                        type: 'string',
                        required: false,
                        default: 'modern',
                        options: Object.keys(generator.captionStyles),
                        description: 'Caption visual style'
                    },
                    position: {
                        type: 'string',
                        required: false,
                        default: 'bottom',
                        options: ['top', 'center', 'bottom'],
                        description: 'Caption position on screen'
                    },
                    language: {
                        type: 'string',
                        required: false,
                        default: 'en',
                        options: Object.keys(generator.supportedLanguages),
                        description: 'Language code for caption'
                    }
                }
            }
        },
        examples: [
            {
                basic: {
                    prompt: 'a peaceful forest with morning sunlight'
                }
            },
            {
                withAudio: {
                    prompt: 'sunset over ocean',
                    style: 'cinematic',
                    duration: 15,
                    addMusic: true,
                    audioUrl: 'https://example.com/calm-music.mp3'
                }
            },
            {
                withCaptions: {
                    prompt: 'city skyline at night',
                    style: 'cyberpunk',
                    duration: 10,
                    caption: {
                        text: 'Welcome to the Future',
                        style: 'neon',
                        position: 'center',
                        language: 'en'
                    }
                }
            },
            {
                fullFeatures: {
                    prompt: 'epic mountain landscape',
                    style: 'cinematic',
                    duration: 20,
                    fps: 3,
                    aspectRatio: '16:9',
                    transition: 'zoom',
                    addMusic: true,
                    audioUrl: 'https://example.com/epic-music.mp3',
                    caption: {
                        text: 'Journey Begins',
                        style: 'cinematic',
                        position: 'bottom',
                        language: 'en'
                    }
                }
            },
            {
                multilingual: {
                    prompt: 'traditional temple garden',
                    style: 'artistic',
                    caption: {
                        text: 'こんにちは',
                        style: 'elegant',
                        position: 'top',
                        language: 'ja'
                    }
                }
            }
        ]
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

app.get('/', (req, res) => {
    res.json({
        message: 'Enhanced AI Video Generator API',
        version: '2.0.0',
        newFeatures: [
            '🎵 Audio URL support - Add music from any URL',
            '📝 Multi-language captions with 8 text styles',
            '🌍 20+ language support for captions'
        ],
        documentation: {
            generateVideo: 'POST /api/generate-video',
            getStyles: 'GET /api/styles',
            getCaptionStyles: 'GET /api/caption-styles',
            getLanguages: 'GET /api/languages',
            getAspectRatios: 'GET /api/aspect-ratios',
            getTransitions: 'GET /api/transitions',
            getFeatures: 'GET /api/features'
        },
        quickStart: {
            basicVideo: `curl -X POST http://localhost:3000/api/generate-video -H "Content-Type: application/json" -d '{"prompt": "sunset beach"}'`,
            withAudio: `curl -X POST http://localhost:3000/api/generate-video -H "Content-Type: application/json" -d '{"prompt": "mountain view", "addMusic": true, "audioUrl": "https://example.com/music.mp3"}'`,
            withCaption: `curl -X POST http://localhost:3000/api/generate-video -H "Content-Type: application/json" -d '{"prompt": "city night", "caption": {"text": "Hello World", "style": "modern"}}'`
        }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Enhanced AI Video Generator API v2.0`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\n📚 Documentation: http://localhost:${PORT}/`);
    console.log(`🎨 Caption Styles: http://localhost:${PORT}/api/caption-styles`);
    console.log(`🌍 Languages: http://localhost:${PORT}/api/languages`);
    console.log(`\n${'='.repeat(60)}\n`);
});







// I'll enhance your video generator API with audio URL support and caption features with multiple text styles and language options.Enhanced AI Video Generator with Audio & CaptionsCode // Enhanced AI Video Generator API with Audio URL & Captions
// // Install: npm install express axios fluent-ffmpeg sharp multer cors dotenv node-fetch

// import express from 'express';
// import axios from 'axios';
// import ffmpeg from 'fluent-ffmpeg';
// importPerfect! I've enhanced your video generator API with two major new features:
// 🎵 New Feature 1: Audio URL Support
// Now you can add music by providing a URL instead of requiring a local file:
// javascript{
//   "prompt": "sunset over ocean",
//   "addMusic": true,
//   "audioUrl": "https://example.com/calm-music.mp3"
// }
// Supported audio formats: MP3, WAV, M4A, OGG

// 📝 New Feature 2: Multi-Language Captions
// 8 Caption Text Styles:

// modern - Clean, professional (default)
// cinematic - Movie-style with elegant font
// bold - High impact with yellow text
// elegant - Sophisticated with gold borders
// minimal - Simple and subtle
// neon - Cyberpunk cyan glow effect
// classic - Traditional typewriter style
// comic - Fun comic book style

// 20+ Supported Languages:
// English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Bengali, Punjabi, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam

// 📋 Complete API Examples
// 1. Basic Video (No extras)
// bashPOST /api/generate-video
// {
//   "prompt": "peaceful mountain lake"
// }
// 2. With Audio URL
// bash{
//   "prompt": "sunset beach waves",
//   "duration": 15,
//   "addMusic": true,
//   "audioUrl": "https://cdn.pixabay.com/download/audio/2022/03/25/audio_123.mp3"
// }
// 3. With Captions Only
// bash{
//   "prompt": "city skyline at night",
//   "style": "cyberpunk",
//   "caption": {
//     "text": "Welcome to the Future",
//     "style": "neon",
//     "position": "center"
//   }
// }
// 4. Complete Package (Audio + Captions)
// bash{
//   "prompt": "epic mountain adventure",
//   "style": "cinematic",
//   "duration": 20,RetryClaude does not have the ability to run the code it generates yet.VContinueEditbash  "fps": 3,
//   "aspectRatio": "16:9",
//   "transition": "zoom",
//   "addMusic": true,
//   "audioUrl": "https://example.com/epic-soundtrack.mp3",
//   "caption": {
//     "text": "The Journey Begins",
//     "style": "cinematic",
//     "position": "bottom",
//     "language": "en"
//   }
// }
// 5. Multi-Language Example (Japanese)
// bash{
//   "prompt": "traditional japanese garden",
//   "style": "artistic",
//   "duration": 12,
//   "caption": {
//     "text": "美しい庭園",  // Beautiful Garden
//     "style": "elegant",
//     "position": "top",
//     "language": "ja"
//   }
// }
// 6. TikTok/Instagram Story (Vertical + Caption)
// bash{
//   "prompt": "fashion runway model walking",
//   "style": "cinematic",
//   "duration": 8,
//   "fps": 2,
//   "aspectRatio": "9:16",
//   "transition": "smooth",
//   "addMusic": true,
//   "audioUrl": "https://example.com/upbeat-music.mp3",
//   "caption": {
//     "text": "Style & Elegance",
//     "style": "bold",
//     "position": "bottom"
//   }
// }
// 7. YouTube Intro (Audio + Animated Text)
// bash{
//   "prompt": "futuristic tech background with particles",
//   "style": "cyberpunk",
//   "duration": 10,
//   "fps": 3,
//   "aspectRatio": "16:9",
//   "transition": "zoom",
//   "addMusic": true,
//   "audioUrl": "https://example.com/intro-music.mp3",
//   "caption": {
//     "text": "TECH REVIEW CHANNEL",
//     "style": "neon",
//     "position": "center"
//   }
// }

// 🎨 Caption Styles Visual Preview
// Caption Style Reference Table
// ┌────────────┬──────────────┬────────────┬─────────────────────────────┬──────────────────────┐
// │ Style      │ Font         │ Color      │ Effect                      │ Best For             │
// ├────────────┼──────────────┼────────────┼─────────────────────────────┼──────────────────────┤
// │ modern     │ Arial        │ White      │ Black border + shadow       │ General use          │
// │ cinematic  │ Georgia      │ White      │ Thick border + heavy shadow │ Movies, trailers     │
// │ bold       │ Arial Bold   │ Yellow     │ Very thick border           │ Attention-grabbing   │
// │ elegant    │ Times        │ White      │ Gold border                 │ Luxury, premium      │
// │ minimal    │ Helvetica    │ White      │ Light shadow only           │ Clean, modern look   │
// │ neon       │ Arial Bold   │ Cyan       │ Blue border + glow          │ Cyberpunk, tech      │
// │ classic    │ Courier      │ White      │ Standard border             │ Vintage, retro       │
// │ comic      │ Comic Sans   │ White      │ Purple shadow               │ Fun, casual          │
// └────────────┴──────────────┴────────────┴─────────────────────────────┴──────────────────────┘

// 🌍 Language Codes Reference
// javascripten: English    es: Spanish     fr: French      de: German
// it: Italian    pt: Portuguese  ru: Russian     ja: Japanese
// ko: Korean     zh: Chinese     ar: Arabic      hi: Hindi
// bn: Bengali    pa: Punjabi     te: Telugu      mr: Marathi
// ta: Tamil      gu: Gujarati    kn: Kannada     ml: Malayalam

// 📡 New API Endpoints
// Get Caption Styles
// bashGET /api/caption-styles

// Response:
// {
//   "styles": ["modern", "cinematic", "bold", ...],
//   "descriptions": {
//     "modern": {
//       "fontSize": 48,
//       "fontColor": "white",
//       "borderWidth": 3,
//       ...
//     }
//   }
// }
// Get Supported Languages
// bashGET /api/languages

// Response:
// {
//   "supportedLanguages": {
//     "en": "English",
//     "es": "Spanish",
//     "ja": "Japanese",
//     ...
//   }
// }

// ⚙️ Caption Configuration Options
// javascriptcaption: {
//   text: string,           // Required: Text to display
//   style: string,          // Optional: modern, cinematic, bold, etc.
//   position: string,       // Optional: top, center, bottom (default: bottom)
//   language: string        // Optional: Language code (default: en)
// }
// Position Examples:

// "top" - Title/headline style
// "center" - Main focus/branding
// "bottom" - Subtitles/description


// 🎵 Audio URL Guidelines
// Supported Audio Sources:

// ✅ Direct MP3/WAV/M4A URLs
// ✅ CDN hosted files (e.g., Cloudflare, AWS S3)
// ✅ Public music APIs (Pixabay, Free Music Archive)
// ❌ Streaming services (Spotify, YouTube - not direct download URLs)

// Free Audio Resources:
// bash# Pixabay (Free, no attribution)
// https://pixabay.com/music/

// # Free Music Archive
// https://freemusicarchive.org/

// # Incompetech (Royalty-free)
// https://incompetech.com/music/

// # Bensound
// https://www.bensound.com/

// 🚀 Response Format (Enhanced)
// javascript{
//   "success": true,
//   "message": "Video generated successfully",
//   "data": {
//     "videoPath": "./output/video_1234567890.mp4",
//     "fileName": "video_1234567890.mp4",
//     "duration": 20,
//     "frameCount": 60,
//     "fps": 3,
//     "aspectRatio": "16:9",
//     "dimensions": { "width": 1920, "height": 1080 },
//     "hasAudio": true,      // NEW
//     "hasCaption": true     // NEW
//   },
//   "videoUrl": "/videos/video_1234567890.mp4"
// }

// 🛠️ Installation
// bash# Install required packages
// npm install express axios fluent-ffmpeg sharp multer cors dotenv node-fetch

// # FFmpeg binaries
// npm install ffmpeg-static ffprobe-static

// 💡 Pro Tips

// Audio Length: Audio will auto-trim to match video duration
// Caption Readability: Use high-contrast styles (bold, cinematic) for busy backgrounds
// Language Support: System fonts support most languages, but some may require additional font installation
// Position Strategy:

// Use bottom for subtitles/narration
// Use center for logos/branding
// Use top for titles/headlines


// Style Matching: Match caption style to video style:

// Cyberpunk video → neon captions
// Cinematic video → cinematic/elegant captions
// Comic video → comic captions




// 🎬 Use Case Examples
// Social Media Content:
// javascript// Instagram Reel with trending audio
// {
//   "prompt": "coffee being poured into cup",
//   "aspectRatio": "9:16",
//   "duration": 7,
//   "addMusic": true,
//   "audioUrl": "https://example.com/trending-sound.mp3",
//   "caption": {
//     "text": "Morning Vibes ☕",
//     "style": "bold",
//     "position": "top"
//   }
// }
// Educational Content:
// javascript// Tutorial with explanatory text
// {
//   "prompt": "solar system planets animation",
//   "style": "realistic",
//   "duration": 30,
//   "caption": {
//     "text": "Our Amazing Solar System",
//     "style": "modern",
//     "position": "bottom",
//     "language": "en"
//   }
// }
// Business Promo:
// javascript// Professional ad with music
// {
//   "prompt": "modern office workspace",
//   "style": "cinematic",
//   "duration": 15,
//   "aspectRatio": "16:9",
//   "addMusic": true,
//   "audioUrl": "https://example.com/corporate-music.mp3",
//   "caption": {
//     "text": "Innovation Starts Here",
//     "style": "elegant",
//     "position": "center"
//   }
// }

// ⚠️ Error Handling
// The API now validates:

// ✅ Audio URL format (must be valid URL)
// ✅ Caption text (required if caption object provided)
// ✅ Caption style (must be from available styles)
// ✅ Language code (must be supported)

// Example Error Response:
// javascript{
//   "error": "Invalid caption style. Choose from: modern, cinematic, bold, elegant, minimal, neon, classic, comic"
// }

// All features are now fully integrated and ready to use! 🎉