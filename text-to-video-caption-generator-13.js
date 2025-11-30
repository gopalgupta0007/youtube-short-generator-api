// // AI Video Generator - Voice-Synced Captions (No Animation)
// // Install: npm install express axios fluent-ffmpeg sharp cors dotenv say

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
// import say from 'say';
// import { promisify } from 'util';

// const sayExport = promisify(say.export);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// ffmpeg.setFfmpegPath(ffmpegPath);
// ffmpeg.setFfprobePath(ffprobePath.path);

// const app = express();
// app.use(express.json({ limit: '50mb' }));
// app.use(cors());
// app.use('/videos', express.static('output'));
// app.use('/audio', express.static('audio'));

// class AIVideoGenerator {
//     constructor() {
//         this.apis = {
//             pollinations: 'https://image.pollinations.ai/prompt/',
//             googleTTS: 'https://translate.google.com/translate_tts'
//         };

//         this.outputDir = './output';
//         this.framesDir = './frames';
//         this.audioDir = './audio';
//         this.tempDir = './temp';

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

//         this.getCaptionStyle = (styleName, dimensions) => {
//             const baseStyles = {
//                 default: {
//                     fontsize: 48,
//                     fontcolor: 'white',
//                     shadowcolor: 'black',
//                     shadowx: 3,
//                     shadowy: 3,
//                     box: true,
//                     boxcolor: 'black@0.75',
//                     marginBottom: 140
//                 },
//                 bold: {
//                     fontsize: 54,
//                     fontcolor: 'white',
//                     shadowcolor: 'black',
//                     shadowx: 4,
//                     shadowy: 4,
//                     box: true,
//                     boxcolor: 'black@0.8',
//                     marginBottom: 150
//                 },
//                 modern: {
//                     fontsize: 52,
//                     fontcolor: 'yellow',
//                     shadowcolor: 'black',
//                     shadowx: 3,
//                     shadowy: 3,
//                     box: true,
//                     boxcolor: 'black@0.8',
//                     marginBottom: 145
//                 },
//                 elegant: {
//                     fontsize: 46,
//                     fontcolor: 'white',
//                     shadowcolor: 'navy',
//                     shadowx: 3,
//                     shadowy: 3,
//                     box: true,
//                     boxcolor: 'navy@0.75',
//                     marginBottom: 135
//                 },
//                 vibrant: {
//                     fontsize: 50,
//                     fontcolor: 'cyan',
//                     shadowcolor: 'black',
//                     shadowx: 4,
//                     shadowy: 4,
//                     box: true,
//                     boxcolor: 'black@0.85',
//                     marginBottom: 148
//                 },
//                 gaming: {
//                     fontsize: 48,
//                     fontcolor: 'lime',
//                     shadowcolor: 'darkgreen',
//                     shadowx: 3,
//                     shadowy: 3,
//                     box: true,
//                     boxcolor: 'black@0.8',
//                     marginBottom: 142
//                 }
//             };

//             const style = baseStyles[styleName] || baseStyles.default;
//             style.maxWidth = Math.floor(dimensions.width * 0.92);
            
//             if (dimensions.width < 720) {
//                 style.fontsize = Math.floor(style.fontsize * 0.7);
//                 style.marginBottom = 100;
//             } else if (dimensions.width < 1080) {
//                 style.fontsize = Math.floor(style.fontsize * 0.85);
//                 style.marginBottom = 120;
//             }

//             return style;
//         };

//         [this.outputDir, this.framesDir, this.audioDir, this.tempDir].forEach(dir => {
//             if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//         });
//     }

//     async generateImage(prompt, style, seed, dimensions, retries = 3) {
//         for (let attempt = 1; attempt <= retries; attempt++) {
//             try {
//                 const fullPrompt = style ? `${prompt}, ${style}` : prompt;
//                 const encodedPrompt = encodeURIComponent(fullPrompt);

//                 let url = `${this.apis.pollinations}${encodedPrompt}`;
//                 url += `?seed=${seed}`;
//                 url += `&width=${dimensions.width}&height=${dimensions.height}`;
//                 url += `&nologo=true&enhance=true`;

//                 console.log(`Generating image (attempt ${attempt}/${retries}): ${prompt.substring(0, 50)}...`);

//                 const response = await axios.get(url, {
//                     responseType: 'arraybuffer',
//                     timeout: 45000, // Increased timeout
//                     headers: {
//                         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
//                     }
//                 });

//                 console.log(`✓ Image generated successfully`);
//                 return Buffer.from(response.data);

//             } catch (error) {
//                 console.error(`Image generation attempt ${attempt} failed:`, error.message);
                
//                 if (attempt < retries) {
//                     const waitTime = attempt * 2000; // Wait 2s, 4s, 6s between retries
//                     console.log(`Retrying in ${waitTime/1000}s...`);
//                     await this.delay(waitTime);
//                 } else {
//                     // Final attempt failed, create a placeholder image
//                     console.log('All attempts failed, creating placeholder image...');
//                     return this.createPlaceholderImage(dimensions);
//                 }
//             }
//         }
//     }

//     /**
//      * Create a simple placeholder image when API fails
//      */
//     async createPlaceholderImage(dimensions) {
//         try {
//             // Create a solid color image with text
//             const svg = `
//                 <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
//                     <rect width="100%" height="100%" fill="#1a1a2e"/>
//                     <text x="50%" y="50%" font-family="Arial" font-size="48" fill="#ffffff" 
//                           text-anchor="middle" dominant-baseline="middle">
//                         Image Generation Failed
//                     </text>
//                     <text x="50%" y="60%" font-family="Arial" font-size="24" fill="#cccccc" 
//                           text-anchor="middle" dominant-baseline="middle">
//                         Using placeholder
//                     </text>
//                 </svg>
//             `;
            
//             return await sharp(Buffer.from(svg))
//                 .png()
//                 .toBuffer();
//         } catch (err) {
//             // If even placeholder fails, create minimal buffer
//             console.error('Placeholder creation failed:', err.message);
//             return sharp({
//                 create: {
//                     width: dimensions.width,
//                     height: dimensions.height,
//                     channels: 3,
//                     background: { r: 26, g: 26, b: 46 }
//                 }
//             }).png().toBuffer();
//         }
//     }

//     async generateSceneFrames(prompt, duration, fps, style, dimensions, sceneIndex) {
//         const frameCount = Math.ceil(duration * fps);
//         const frames = [];

//         console.log(`Generating ${frameCount} frames for ${duration}s`);

//         const seed = Math.floor(Math.random() * 1000000);
//         const baseImage = await this.generateImage(prompt, style, seed, dimensions);

//         for (let i = 0; i < frameCount; i++) {
//             const framePath = path.join(
//                 this.framesDir,
//                 `scene${sceneIndex}_frame_${String(i).padStart(5, '0')}.png`
//             );

//             const progress = i / Math.max(1, frameCount - 1);
//             const scale = 1.0 + (progress * 0.04);
//             const offsetX = Math.sin(progress * Math.PI) * 12;
//             const offsetY = Math.cos(progress * Math.PI * 0.5) * 6;

//             const scaledWidth = Math.floor(dimensions.width * scale);
//             const scaledHeight = Math.floor(dimensions.height * scale);

//             await sharp(baseImage)
//                 .resize(scaledWidth, scaledHeight, { 
//                     fit: 'cover', 
//                     position: 'center',
//                     kernel: 'lanczos3'
//                 })
//                 .extract({
//                     left: Math.max(0, Math.min(scaledWidth - dimensions.width, Math.floor(Math.abs(offsetX)))),
//                     top: Math.max(0, Math.min(scaledHeight - dimensions.height, Math.floor(Math.abs(offsetY)))),
//                     width: dimensions.width,
//                     height: dimensions.height
//                 })
//                 .toFile(framePath);

//             frames.push(framePath);
//         }

//         return { frames, frameCount, fps };
//     }

//     async generateVoiceover(text, outputPath, voice = 'Brian') {
//         try {
//             const cleanText = text.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            
//             console.log(`Generating voiceover...`);
//             const response = await axios.get(this.apis.ttsApi, {
//                 params: { voice, text: cleanText },
//                 responseType: 'arraybuffer',
//                 timeout: 30000
//             });

//             fs.writeFileSync(outputPath, Buffer.from(response.data));
//             console.log(`✓ Voiceover generated`);
//             return outputPath;

//         } catch (error) {
//             console.log('API TTS failed, trying local TTS...');
            
//             try {
//                 const cleanText = text.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
//                 await sayExport(cleanText, null, null, outputPath);
//                 console.log(`✓ Voiceover generated (local)`);
//                 return outputPath;
//             } catch (err) {
//                 console.log('Creating silent audio...');
//                 return this.createSilentAudio(outputPath, 3);
//             }
//         }
//     }

//     createSilentAudio(outputPath, duration) {
//         return new Promise((resolve, reject) => {
//             ffmpeg()
//                 .input('anullsrc=r=44100:cl=stereo')
//                 .inputFormat('lavfi')
//                 .duration(duration)
//                 .audioCodec('libmp3lame')
//                 .output(outputPath)
//                 .on('end', () => resolve(outputPath))
//                 .on('error', reject)
//                 .run();
//         });
//     }

//     /**
//      * Split text into words and estimate timing for voice-synced captions
//      * speedFactor adjusts timing when audio is sped up
//      */
//     splitTextIntoWords(text, audioDuration, speedFactor = 1.0) {
//         const cleanText = text.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
//         const words = cleanText.split(' ');
        
//         // Adjust timing based on speed factor
//         const adjustedDuration = audioDuration / speedFactor;
//         const timePerWord = adjustedDuration / words.length;

//         const wordTimings = [];
//         let currentTime = 0;

//         for (let i = 0; i < words.length; i++) {
//             const word = words[i];
//             const duration = timePerWord;
            
//             wordTimings.push({
//                 word: word,
//                 start: currentTime,
//                 end: currentTime + duration
//             });
            
//             currentTime += duration;
//         }

//         return wordTimings;
//     }

//     /**
//      * Create word-by-word captions synced with voice
//      * speedFactor adjusts phrase display speed
//      */
//     buildWordByWordCaptions(text, audioDuration, speedFactor, styleName, dimensions) {
//         const captionStyle = this.getCaptionStyle(styleName, dimensions);
//         const wordTimings = this.splitTextIntoWords(text, audioDuration, speedFactor);
        
//         // Adjust words per phrase based on speed
//         // If speech is fast (speedFactor > 1), show more words per phrase
//         let wordsPerPhrase = 4;
//         if (speedFactor > 1.5) {
//             wordsPerPhrase = 3; // Show fewer words when speech is very fast
//         } else if (speedFactor > 1.2) {
//             wordsPerPhrase = 4; // Normal fast speech
//         } else {
//             wordsPerPhrase = 5; // Slower, more words per phrase
//         }
        
//         const phrases = [];
        
//         for (let i = 0; i < wordTimings.length; i += wordsPerPhrase) {
//             const phraseWords = wordTimings.slice(i, i + wordsPerPhrase);
//             const phraseText = phraseWords.map(w => w.word).join(' ');
//             const phraseStart = phraseWords[0].start;
//             const phraseEnd = phraseWords[phraseWords.length - 1].end;
            
//             phrases.push({
//                 text: phraseText,
//                 start: phraseStart,
//                 end: phraseEnd
//             });
//         }

//         return phrases;
//     }

//     /**
//      * Build multiple caption filters for voice-synced display
//      * speedFactor ensures captions match sped-up audio
//      */
//     buildVoiceSyncedCaptionFilters(text, audioDuration, speedFactor, styleName, dimensions) {
//         const captionStyle = this.getCaptionStyle(styleName, dimensions);
//         const phrases = this.buildWordByWordCaptions(text, audioDuration, speedFactor, styleName, dimensions);
        
//         const filters = [];
        
//         for (const phrase of phrases) {
//             const charWidth = captionStyle.fontsize * 0.5;
//             const maxCharsPerLine = Math.floor(captionStyle.maxWidth / charWidth);
            
//             // Word wrap for long phrases
//             const words = phrase.text.split(' ');
//             const lines = [];
//             let currentLine = '';

//             for (const word of words) {
//                 const testLine = currentLine + (currentLine ? ' ' : '') + word;
//                 if (testLine.length > maxCharsPerLine && currentLine) {
//                     lines.push(currentLine);
//                     currentLine = word;
//                 } else {
//                     currentLine = testLine;
//                 }
//             }
//             if (currentLine) lines.push(currentLine);

//             const maxLines = dimensions.height > dimensions.width ? 2 : 3;
//             const displayText = lines.slice(0, maxLines).join('\\n');
//             const escapedText = displayText.replace(/'/g, "'\\''").replace(/:/g, '\\:').replace(/,/g, '\\,');

//             const x = '(w-text_w)/2';
//             const y = `h-text_h-${captionStyle.marginBottom}`;

//             let filter = `drawtext=`;
//             filter += `text='${escapedText}':`;
//             filter += `fontsize=${captionStyle.fontsize}:`;
//             filter += `fontcolor=${captionStyle.fontcolor}:`;
//             filter += `x=${x}:y=${y}:`;
//             filter += `shadowcolor=${captionStyle.shadowcolor}:`;
//             filter += `shadowx=${captionStyle.shadowx}:`;
//             filter += `shadowy=${captionStyle.shadowy}:`;
            
//             if (captionStyle.box) {
//                 filter += `box=1:`;
//                 filter += `boxcolor=${captionStyle.boxcolor}:`;
//                 filter += `boxborderw=25:`;
//             }
            
//             filter += `enable='between(t\\,${phrase.start.toFixed(2)}\\,${phrase.end.toFixed(2)})'`;
            
//             filters.push(filter);
//         }

//         return filters.join(',');
//     }

//     getAudioDuration(audioPath) {
//         return new Promise((resolve, reject) => {
//             // First check if file exists and has content
//             if (!fs.existsSync(audioPath)) {
//                 reject(new Error(`Audio file not found: ${audioPath}`));
//                 return;
//             }

//             const stats = fs.statSync(audioPath);
//             if (stats.size < 100) {
//                 reject(new Error(`Audio file too small (${stats.size} bytes), likely invalid`));
//                 return;
//             }

//             ffmpeg.ffprobe(audioPath, (err, metadata) => {
//                 if (err) {
//                     console.error('FFprobe error:', err.message);
//                     reject(err);
//                 } else if (!metadata || !metadata.format || !metadata.format.duration) {
//                     reject(new Error('Invalid audio metadata'));
//                 } else {
//                     resolve(metadata.format.duration);
//                 }
//             });
//         });
//     }

//     async fitAudioToLength(audioPath, targetDuration) {
//         const audioDuration = await this.getAudioDuration(audioPath);
//         const fittedPath = audioPath.replace('.mp3', '_fitted.mp3');

//         if (Math.abs(audioDuration - targetDuration) < 0.1) {
//             return { 
//                 path: audioPath, 
//                 duration: audioDuration,
//                 speedFactor: 1.0,
//                 originalDuration: audioDuration
//             };
//         }

//         if (audioDuration < targetDuration) {
//             const silenceDuration = targetDuration - audioDuration;
//             console.log(`  Padding audio: ${audioDuration.toFixed(2)}s -> ${targetDuration.toFixed(2)}s`);

//             return new Promise((resolve, reject) => {
//                 ffmpeg()
//                     .input(audioPath)
//                     .input('anullsrc=r=44100:cl=stereo')
//                     .inputFormat('lavfi')
//                     .complexFilter([
//                         `[1:a]atrim=duration=${silenceDuration}[silence]`,
//                         `[0:a][silence]concat=n=2:v=0:a=1[out]`
//                     ])
//                     .outputOptions(['-map', '[out]'])
//                     .audioCodec('libmp3lame')
//                     .output(fittedPath)
//                     .on('end', () => resolve({ 
//                         path: fittedPath, 
//                         duration: targetDuration,
//                         speedFactor: 1.0,
//                         originalDuration: audioDuration
//                     }))
//                     .on('error', reject)
//                     .run();
//             });
//         } else {
//             // Audio is too long - calculate speed factor
//             const speedFactor = audioDuration / targetDuration;
//             const tempoFactor = Math.min(speedFactor, 2.0);
            
//             console.log(`  ⚡ Speeding up audio: ${audioDuration.toFixed(2)}s -> ${targetDuration.toFixed(2)}s (${speedFactor.toFixed(2)}x speed)`);
//             console.log(`  ⚡ Captions will also speed up ${speedFactor.toFixed(2)}x`);
            
//             if (speedFactor > 2.0) {
//                 console.log(`  ⚠️  WARNING: Text very long for scene. Consider shortening or extending scene duration.`);
//             }

//             return new Promise((resolve, reject) => {
//                 ffmpeg()
//                     .input(audioPath)
//                     .audioFilters([`atempo=${tempoFactor.toFixed(3)}`])
//                     .audioCodec('libmp3lame')
//                     .duration(targetDuration)
//                     .output(fittedPath)
//                     .on('end', () => resolve({ 
//                         path: fittedPath, 
//                         duration: targetDuration,
//                         speedFactor: speedFactor, // Return actual speed factor
//                         originalDuration: audioDuration
//                     }))
//                     .on('error', reject)
//                     .run();
//             });
//         }
//     }

//     async createSceneSegment(scene, sceneIndex, fps, style, dimensions, captionStyle) {
//         const duration = scene.end - scene.start;
//         const segmentPath = path.join(this.tempDir, `segment_${sceneIndex}.mp4`);

//         console.log(`\n--- Scene ${sceneIndex + 1} ---`);
//         console.log(`Duration: ${duration}s (${scene.start}s - ${scene.end}s)`);

//         const { frames, frameCount } = await this.generateSceneFrames(
//             scene.imagePrompt,
//             duration,
//             fps,
//             style,
//             dimensions,
//             sceneIndex
//         );

//         const audioPath = path.join(this.audioDir, `voice_${sceneIndex}.mp3`);
//         await this.generateVoiceover(scene.sceneContent, audioPath);

//         // Get original audio duration
//         const originalAudioDuration = await this.getAudioDuration(audioPath);
        
//         // Fit audio to scene duration and get speed factor
//         const fittedAudio = await this.fitAudioToLength(audioPath, duration);
//         const speedFactor = fittedAudio.speedFactor;

//         console.log(`  Original audio: ${originalAudioDuration.toFixed(2)}s`);
//         console.log(`  Target duration: ${duration.toFixed(2)}s`);
//         console.log(`  Speed factor: ${speedFactor.toFixed(2)}x`);

//         const framePattern = path.join(
//             this.framesDir,
//             `scene${sceneIndex}_frame_%05d.png`
//         );

//         return new Promise((resolve, reject) => {
//             // FIXED: Pass speedFactor to caption generation
//             const captionFilters = this.buildVoiceSyncedCaptionFilters(
//                 scene.sceneContent,
//                 originalAudioDuration,
//                 speedFactor, // Pass speed factor here!
//                 captionStyle,
//                 dimensions
//             );

//             if (speedFactor > 1.0) {
//                 console.log(`  📝 Captions: Sped up ${speedFactor.toFixed(2)}x to match audio`);
//             } else {
//                 console.log(`  📝 Captions: Normal speed (voice-synced)`);
//             }

//             ffmpeg()
//                 .input(framePattern)
//                 .inputOptions([
//                     '-framerate', fps.toString(),
//                     '-t', duration.toString()
//                 ])
//                 .input(fittedAudio.path)
//                 .outputOptions([
//                     '-c:v', 'libx264',
//                     '-pix_fmt', 'yuv420p',
//                     '-r', fps.toString(),
//                     '-crf', '20',
//                     '-preset', 'medium',
//                     '-c:a', 'aac',
//                     '-b:a', '192k',
//                     '-t', duration.toString()
//                 ])
//                 .videoFilters(captionFilters)
//                 .output(segmentPath)
//                 .on('progress', (progress) => {
//                     if (progress.percent) {
//                         process.stdout.write(`\rScene ${sceneIndex + 1}: ${progress.percent.toFixed(1)}%`);
//                     }
//                 })
//                 .on('end', () => {
//                     console.log(`\n✓ Scene ${sceneIndex + 1} completed`);
//                     resolve(segmentPath);
//                 })
//                 .on('error', (err) => {
//                     console.error(`\nScene ${sceneIndex + 1} error:`, err.message);
//                     reject(err);
//                 })
//                 .run();
//         });
//     }

//     async mergeSegmentsWithTransitions(segmentPaths, scenes, outputName, transitionDuration = 0.6) {
//         return new Promise((resolve, reject) => {
//             const outputPath = path.join(this.outputDir, outputName);

//             console.log(`\n🎬 Merging ${segmentPaths.length} scenes...`);

//             if (segmentPaths.length === 1) {
//                 fs.copyFileSync(segmentPaths[0], outputPath);
//                 console.log(`\n✅ Single scene video created`);
//                 resolve(outputPath);
//                 return;
//             }

//             let videoFilters = [];
//             let audioFilters = [];
            
//             let currentOffset = 0;
            
//             for (let i = 0; i < segmentPaths.length - 1; i++) {
//                 const input1 = i === 0 ? '[0:v]' : `[v${i-1}]`;
//                 const input2 = `[${i+1}:v]`;
//                 const output = i === segmentPaths.length - 2 ? '[vout]' : `[v${i}]`;
                
//                 const sceneDuration = scenes[i].end - scenes[i].start;
//                 currentOffset += sceneDuration - (i === 0 ? transitionDuration : transitionDuration);
                
//                 videoFilters.push(
//                     `${input1}${input2}xfade=transition=fade:duration=${transitionDuration}:offset=${currentOffset.toFixed(2)}${output}`
//                 );
//             }

//             const audioInputs = segmentPaths.map((_, i) => `[${i}:a]`).join('');
//             audioFilters.push(`${audioInputs}concat=n=${segmentPaths.length}:v=0:a=1[aout]`);

//             const allFilters = [...videoFilters, ...audioFilters];

//             const command = ffmpeg();
//             segmentPaths.forEach(seg => command.input(seg));

//             command
//                 .complexFilter(allFilters)
//                 .outputOptions([
//                     '-map', '[vout]',
//                     '-map', '[aout]',
//                     '-c:v', 'libx264',
//                     '-c:a', 'aac',
//                     '-b:a', '192k',
//                     '-movflags', '+faststart'
//                 ])
//                 .output(outputPath)
//                 .on('progress', (progress) => {
//                     if (progress.percent) {
//                         process.stdout.write(`\rMerging: ${progress.percent.toFixed(1)}%`);
//                     }
//                 })
//                 .on('end', () => {
//                     console.log(`\n\n✅ Final video created: ${outputPath}`);
                    
//                     ffmpeg.ffprobe(outputPath, (err, metadata) => {
//                         if (!err) {
//                             console.log(`📊 Duration: ${metadata.format.duration.toFixed(2)}s`);
//                         }
//                     });
                    
//                     resolve(outputPath);
//                 })
//                 .on('error', (err) => {
//                     console.error('\nTransition merge failed, trying simple concat:', err.message);
//                     this.mergeSegmentsSimple(segmentPaths, outputPath).then(resolve).catch(reject);
//                 })
//                 .run();
//         });
//     }

//     async mergeSegmentsSimple(segmentPaths, outputPath) {
//         return new Promise((resolve, reject) => {
//             const concatFile = path.join(this.tempDir, 'concat.txt');
//             const concatContent = segmentPaths
//                 .map(seg => `file '${path.resolve(seg).replace(/\\/g, '/')}'`)
//                 .join('\n');
//             fs.writeFileSync(concatFile, concatContent);

//             ffmpeg()
//                 .input(concatFile)
//                 .inputOptions(['-f', 'concat', '-safe', '0'])
//                 .outputOptions([
//                     '-c:v', 'libx264',
//                     '-c:a', 'aac',
//                     '-b:a', '192k',
//                     '-movflags', '+faststart'
//                 ])
//                 .output(outputPath)
//                 .on('end', () => resolve(outputPath))
//                 .on('error', reject)
//                 .run();
//         });
//     }

//     async generateVideoFromScenes(options = {}) {
//         const {
//             scenes = [],
//             style = 'realistic',
//             fps = 8,
//             aspectRatio = '9:16',
//             captionStyle = 'bold',
//             transition = true,
//             transitionDuration = 0.6,
//             outputName = `video_${Date.now()}.mp4`
//         } = options;

//         if (!scenes || scenes.length === 0) {
//             throw new Error('Scenes array is required');
//         }

//         scenes.sort((a, b) => a.start - b.start);

//         for (const scene of scenes) {
//             if (!scene.imagePrompt || !scene.sceneContent) {
//                 throw new Error('Each scene must have imagePrompt and sceneContent');
//             }
//             if (scene.start === undefined || scene.end === undefined) {
//                 throw new Error('Each scene must have start and end times');
//             }
//         }

//         const dimensions = this.aspectRatios[aspectRatio];
//         const stylePrompt = this.stylePresets[style] || style;
//         const totalDuration = Math.max(...scenes.map(s => s.end));

//         console.log('\n' + '='.repeat(70));
//         console.log('🎥 AI VIDEO GENERATOR - VOICE-SYNCED CAPTIONS');
//         console.log('='.repeat(70));
//         console.log(`Scenes: ${scenes.length} | Duration: ${totalDuration}s | FPS: ${fps}`);
//         console.log(`Aspect: ${aspectRatio} | Caption: ${captionStyle} (Voice-synced)`);
//         console.log(`Transitions: ${transition ? 'Yes' : 'No'}`);
//         console.log('='.repeat(70) + '\n');

//         try {
//             this.cleanupTemporaryFiles();

//             const segmentPaths = [];
//             for (let i = 0; i < scenes.length; i++) {
//                 const segmentPath = await this.createSceneSegment(
//                     scenes[i],
//                     i,
//                     fps,
//                     stylePrompt,
//                     dimensions,
//                     captionStyle
//                 );
//                 segmentPaths.push(segmentPath);
                
//                 if (i < scenes.length - 1) {
//                     await this.delay(1000);
//                 }
//             }

//             const finalVideoPath = transition 
//                 ? await this.mergeSegmentsWithTransitions(segmentPaths, scenes, outputName, transitionDuration)
//                 : await this.mergeSegmentsSimple(segmentPaths, outputPath);

//             return {
//                 success: true,
//                 videoPath: finalVideoPath,
//                 fileName: outputName,
//                 totalDuration,
//                 sceneCount: scenes.length,
//                 fps,
//                 aspectRatio,
//                 dimensions,
//                 hasTransitions: transition,
//                 captionType: 'voice-synced'
//             };

//         } catch (error) {
//             console.error('\n❌ Video generation failed:', error);
//             throw error;
//         }
//     }

//     cleanupTemporaryFiles() {
//         const dirs = [this.framesDir, this.tempDir];
//         dirs.forEach(dir => {
//             if (fs.existsSync(dir)) {
//                 fs.readdirSync(dir).forEach(file => {
//                     try {
//                         fs.unlinkSync(path.join(dir, file));
//                     } catch (e) {}
//                 });
//             }
//         });
//     }

//     delay(ms) {
//         return new Promise(resolve => setTimeout(resolve, ms));
//     }
// }

// const generator = new AIVideoGenerator();

// export async function generateVideoFromScenesHandler(generatedScript) {
//     try {
//         const scenes = generatedScript
//         const style = 'realistic'
//         const fps = 8
//         const aspectRatio = '9:16'
//         const captionStyle = 'bold'
//         const transition = true
//         const transitionDuration = 0.6

//         if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
//             return { error: 'Scenes array required' };
//         }

//         const result = await generator.generateVideoFromScenes({
//             scenes,
//             style,
//             fps,
//             aspectRatio,
//             captionStyle,
//             transition,
//             transitionDuration: Math.min(0.75, Math.max(0.5, transitionDuration)),
//             outputName: `video_${Date.now()}.mp4`
//         });

//         return {
//             success: true,
//             message: 'Video generated successfully with voice-synced captions',
//             data: result,
//             videoUrl: `/videos/${result.fileName}`
//         };

//     } catch (error) {
//         console.error('API Error:', error);
//         return {
//             error: 'Video generation failed',
//             details: error.message
//         };
//     }
// };

// app.get('/', (req, res) => {
//     res.json({
//         message: 'AI Video Generator - Voice-Synced Captions',
//         version: '6.0.0',
//         features: {
//             voiceSyncedCaptions: 'Captions appear in sync with voice (3-5 words at a time)',
//             accurateTiming: 'No delay between audio and captions',
//             wordByWord: 'Text splits into phrases that match speech timing',
//             audioFitting: 'Audio automatically fits scene duration'
//         },
//         example: 'Captions change every ~1 second as words are spoken'
//     });
// });

// const PORT = 3000;
// app.listen(PORT, () => {
//     console.log(`\n${'='.repeat(70)}`);
//     console.log(`🚀 AI Video Generator v6.0 - Voice-Synced Captions`);
//     console.log(`${'='.repeat(70)}`);
//     console.log(`\n✨ Captions sync with voice automatically`);
//     console.log(`✨ Shows 3-5 words at a time as they're spoken`);
//     console.log(`✅ No animation feature (removed)`);
//     console.log(`\n${'='.repeat(70)}\n`);
// });


















































































































// AI Video Generator - Voice-Synced Captions (No Animation)
// Install: npm install express axios fluent-ffmpeg sharp cors dotenv say

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
import say from 'say';
import { promisify } from 'util';

const sayExport = promisify(say.export);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use('/videos', express.static('output'));
app.use('/audio', express.static('audio'));

class AIVideoGenerator {
    constructor() {
        this.apis = {
            pollinations: 'https://image.pollinations.ai/prompt/',
            googleTTS: 'https://translate.google.com/translate_tts',
            // Added a TTS API endpoint
            ttsApi: 'https://api.streamelements.com/kappa/v2/speech'
        };

        this.outputDir = './output';
        this.framesDir = './frames';
        this.audioDir = './audio';
        this.tempDir = './temp';

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

        this.getCaptionStyle = (styleName, dimensions) => {
            const baseStyles = {
                default: {
                    fontsize: 48,
                    fontcolor: 'white',
                    shadowcolor: 'black',
                    shadowx: 3,
                    shadowy: 3,
                    box: true,
                    boxcolor: 'black@0.75',
                    marginBottom: 140
                },
                bold: {
                    fontsize: 54,
                    fontcolor: 'white',
                    shadowcolor: 'black',
                    shadowx: 4,
                    shadowy: 4,
                    box: true,
                    boxcolor: 'black@0.8',
                    marginBottom: 150
                },
                modern: {
                    fontsize: 52,
                    fontcolor: 'yellow',
                    shadowcolor: 'black',
                    shadowx: 3,
                    shadowy: 3,
                    box: true,
                    boxcolor: 'black@0.8',
                    marginBottom: 145
                },
                elegant: {
                    fontsize: 46,
                    fontcolor: 'white',
                    shadowcolor: 'navy',
                    shadowx: 3,
                    shadowy: 3,
                    box: true,
                    boxcolor: 'navy@0.75',
                    marginBottom: 135
                },
                vibrant: {
                    fontsize: 50,
                    fontcolor: 'cyan',
                    shadowcolor: 'black',
                    shadowx: 4,
                    shadowy: 4,
                    box: true,
                    boxcolor: 'black@0.85',
                    marginBottom: 148
                },
                gaming: {
                    fontsize: 48,
                    fontcolor: 'lime',
                    shadowcolor: 'darkgreen',
                    shadowx: 3,
                    shadowy: 3,
                    box: true,
                    boxcolor: 'black@0.8',
                    marginBottom: 142
                }
            };

            const style = baseStyles[styleName] || baseStyles.default;
            style.maxWidth = Math.floor(dimensions.width * 0.92);
            
            if (dimensions.width < 720) {
                style.fontsize = Math.floor(style.fontsize * 0.7);
                style.marginBottom = 100;
            } else if (dimensions.width < 1080) {
                style.fontsize = Math.floor(style.fontsize * 0.85);
                style.marginBottom = 120;
            }

            return style;
        };

        [this.outputDir, this.framesDir, this.audioDir, this.tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });
    }

    async generateImage(prompt, style, seed, dimensions, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const fullPrompt = style ? `${prompt}, ${style}` : prompt;
                const encodedPrompt = encodeURIComponent(fullPrompt);

                let url = `${this.apis.pollinations}${encodedPrompt}`;
                url += `?seed=${seed}`;
                url += `&width=${dimensions.width}&height=${dimensions.height}`;
                url += `&nologo=true&enhance=true`;

                console.log(`Generating image (attempt ${attempt}/${retries}): ${prompt.substring(0, 50)}...`);

                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: 45000, // Increased timeout
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                console.log(`✓ Image generated successfully`);
                return Buffer.from(response.data);

            } catch (error) {
                console.error(`Image generation attempt ${attempt} failed:`, error.message);
                
                if (attempt < retries) {
                    const waitTime = attempt * 2000; // Wait 2s, 4s, 6s between retries
                    console.log(`Retrying in ${waitTime/1000}s...`);
                    await this.delay(waitTime);
                } else {
                    // Final attempt failed, create a placeholder image
                    console.log('All attempts failed, creating placeholder image...');
                    return this.createPlaceholderImage(dimensions);
                }
            }
        }
    }

    /**
     * Create a simple placeholder image when API fails
     */
    async createPlaceholderImage(dimensions) {
        try {
            // Create a solid color image with text
            const svg = `
                <svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="#1a1a2e"/>
                    <text x="50%" y="50%" font-family="Arial" font-size="48" fill="#ffffff" 
                          text-anchor="middle" dominant-baseline="middle">
                        Image Generation Failed
                    </text>
                    <text x="50%" y="60%" font-family="Arial" font-size="24" fill="#cccccc" 
                          text-anchor="middle" dominant-baseline="middle">
                        Using placeholder
                    </text>
                </svg>
            `;
            
            return await sharp(Buffer.from(svg))
                .png()
                .toBuffer();
        } catch (err) {
            // If even placeholder fails, create minimal buffer
            console.error('Placeholder creation failed:', err.message);
            return sharp({
                create: {
                    width: dimensions.width,
                    height: dimensions.height,
                    channels: 3,
                    background: { r: 26, g: 26, b: 46 }
                }
            }).png().toBuffer();
        }
    }

    async generateSceneFrames(prompt, duration, fps, style, dimensions, sceneIndex) {
        const frameCount = Math.ceil(duration * fps);
        const frames = [];

        console.log(`Generating ${frameCount} frames for ${duration}s`);

        const seed = Math.floor(Math.random() * 1000000);
        const baseImage = await this.generateImage(prompt, style, seed, dimensions);

        for (let i = 0; i < frameCount; i++) {
            const framePath = path.join(
                this.framesDir,
                `scene${sceneIndex}_frame_${String(i).padStart(5, '0')}.png`
            );

            const progress = i / Math.max(1, frameCount - 1);
            const scale = 1.0 + (progress * 0.04);
            const offsetX = Math.sin(progress * Math.PI) * 12;
            const offsetY = Math.cos(progress * Math.PI * 0.5) * 6;

            const scaledWidth = Math.floor(dimensions.width * scale);
            const scaledHeight = Math.floor(dimensions.height * scale);

            await sharp(baseImage)
                .resize(scaledWidth, scaledHeight, { 
                    fit: 'cover', 
                    position: 'center',
                    kernel: 'lanczos3'
                })
                .extract({
                    left: Math.max(0, Math.min(scaledWidth - dimensions.width, Math.floor(Math.abs(offsetX)))),
                    top: Math.max(0, Math.min(scaledHeight - dimensions.height, Math.floor(Math.abs(offsetY)))),
                    width: dimensions.width,
                    height: dimensions.height
                })
                .toFile(framePath);

            frames.push(framePath);
        }

        return { frames, frameCount, fps };
    }

    async generateVoiceover(text, outputPath, voice = 'Brian') {
        try {
            const cleanText = text.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            
            console.log(`Generating voiceover for: "${cleanText.substring(0, 50)}..."`);
            
            // Try StreamElements TTS API first
            try {
                const response = await axios.get(this.apis.ttsApi, {
                    params: { 
                        voice: voice, 
                        text: cleanText 
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                fs.writeFileSync(outputPath, Buffer.from(response.data));
                console.log(`✓ Voiceover generated (StreamElements TTS)`);
                return outputPath;
            } catch (apiError) {
                console.log('StreamElements TTS failed, trying Google TTS...');
                
                // Try Google TTS as fallback
                try {
                    const response = await axios.get(this.apis.googleTTS, {
                        params: { 
                            ie: 'UTF-8',
                            q: cleanText,
                            tl: 'en',
                            client: 'tw-ob'
                        },
                        responseType: 'arraybuffer',
                        timeout: 30000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                        }
                    });

                    fs.writeFileSync(outputPath, Buffer.from(response.data));
                    console.log(`✓ Voiceover generated (Google TTS)`);
                    return outputPath;
                } catch (googleError) {
                    console.log('Google TTS failed, trying local TTS...');
                    
                    // Use local TTS as final fallback
                    try {
                        await sayExport(cleanText, null, null, outputPath);
                        console.log(`✓ Voiceover generated (local TTS)`);
                        return outputPath;
                    } catch (localError) {
                        console.log('All TTS methods failed, creating silent audio...');
                        return this.createSilentAudio(outputPath, Math.max(3, cleanText.split(' ').length * 0.4));
                    }
                }
            }

        } catch (error) {
            console.error('Voiceover generation failed:', error.message);
            console.log('Creating silent audio as fallback...');
            return this.createSilentAudio(outputPath, 3);
        }
    }

    createSilentAudio(outputPath, duration) {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input('anullsrc=r=44100:cl=stereo')
                .inputFormat('lavfi')
                .duration(duration)
                .audioCodec('libmp3lame')
                .output(outputPath)
                .on('end', () => {
                    console.log(`✓ Silent audio created (${duration}s)`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error('Error creating silent audio:', err);
                    reject(err);
                })
                .run();
        });
    }

    /**
     * Split text into words and estimate timing for voice-synced captions
     * speedFactor adjusts timing when audio is sped up
     */
    splitTextIntoWords(text, audioDuration, speedFactor = 1.0) {
        const cleanText = text.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        const words = cleanText.split(' ');
        
        // Adjust timing based on speed factor
        const adjustedDuration = audioDuration / speedFactor;
        const timePerWord = adjustedDuration / words.length;

        const wordTimings = [];
        let currentTime = 0;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const duration = timePerWord;
            
            wordTimings.push({
                word: word,
                start: currentTime,
                end: currentTime + duration
            });
            
            currentTime += duration;
        }

        return wordTimings;
    }

    /**
     * Create word-by-word captions synced with voice
     * speedFactor adjusts phrase display speed
     */
    buildWordByWordCaptions(text, audioDuration, speedFactor, styleName, dimensions) {
        const captionStyle = this.getCaptionStyle(styleName, dimensions);
        const wordTimings = this.splitTextIntoWords(text, audioDuration, speedFactor);
        
        // Adjust words per phrase based on speed
        // If speech is fast (speedFactor > 1), show more words per phrase
        let wordsPerPhrase = 4;
        if (speedFactor > 1.5) {
            wordsPerPhrase = 3; // Show fewer words when speech is very fast
        } else if (speedFactor > 1.2) {
            wordsPerPhrase = 4; // Normal fast speech
        } else {
            wordsPerPhrase = 5; // Slower, more words per phrase
        }
        
        const phrases = [];
        
        for (let i = 0; i < wordTimings.length; i += wordsPerPhrase) {
            const phraseWords = wordTimings.slice(i, i + wordsPerPhrase);
            const phraseText = phraseWords.map(w => w.word).join(' ');
            const phraseStart = phraseWords[0].start;
            const phraseEnd = phraseWords[phraseWords.length - 1].end;
            
            phrases.push({
                text: phraseText,
                start: phraseStart,
                end: phraseEnd
            });
        }

        return phrases;
    }

    /**
     * Build multiple caption filters for voice-synced display
     * speedFactor ensures captions match sped-up audio
     */
    buildVoiceSyncedCaptionFilters(text, audioDuration, speedFactor, styleName, dimensions) {
        const captionStyle = this.getCaptionStyle(styleName, dimensions);
        const phrases = this.buildWordByWordCaptions(text, audioDuration, speedFactor, styleName, dimensions);
        
        const filters = [];
        
        for (const phrase of phrases) {
            const charWidth = captionStyle.fontsize * 0.5;
            const maxCharsPerLine = Math.floor(captionStyle.maxWidth / charWidth);
            
            // Word wrap for long phrases
            const words = phrase.text.split(' ');
            const lines = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                if (testLine.length > maxCharsPerLine && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);

            const maxLines = dimensions.height > dimensions.width ? 2 : 3;
            const displayText = lines.slice(0, maxLines).join('\\n');
            const escapedText = displayText.replace(/'/g, "'\\''").replace(/:/g, '\\:').replace(/,/g, '\\,');

            const x = '(w-text_w)/2';
            const y = `h-text_h-${captionStyle.marginBottom}`;

            let filter = `drawtext=`;
            filter += `text='${escapedText}':`;
            filter += `fontsize=${captionStyle.fontsize}:`;
            filter += `fontcolor=${captionStyle.fontcolor}:`;
            filter += `x=${x}:y=${y}:`;
            filter += `shadowcolor=${captionStyle.shadowcolor}:`;
            filter += `shadowx=${captionStyle.shadowx}:`;
            filter += `shadowy=${captionStyle.shadowy}:`;
            
            if (captionStyle.box) {
                filter += `box=1:`;
                filter += `boxcolor=${captionStyle.boxcolor}:`;
                filter += `boxborderw=25:`;
            }
            
            filter += `enable='between(t\\,${phrase.start.toFixed(2)}\\,${phrase.end.toFixed(2)})'`;
            
            filters.push(filter);
        }

        return filters.join(',');
    }

    getAudioDuration(audioPath) {
        return new Promise((resolve, reject) => {
            // First check if file exists and has content
            if (!fs.existsSync(audioPath)) {
                reject(new Error(`Audio file not found: ${audioPath}`));
                return;
            }

            const stats = fs.statSync(audioPath);
            if (stats.size < 100) {
                reject(new Error(`Audio file too small (${stats.size} bytes), likely invalid`));
                return;
            }

            ffmpeg.ffprobe(audioPath, (err, metadata) => {
                if (err) {
                    console.error('FFprobe error:', err.message);
                    reject(err);
                } else if (!metadata || !metadata.format || !metadata.format.duration) {
                    reject(new Error('Invalid audio metadata'));
                } else {
                    resolve(metadata.format.duration);
                }
            });
        });
    }

    async fitAudioToLength(audioPath, targetDuration) {
        const audioDuration = await this.getAudioDuration(audioPath);
        const fittedPath = audioPath.replace('.mp3', '_fitted.mp3');

        if (Math.abs(audioDuration - targetDuration) < 0.1) {
            return { 
                path: audioPath, 
                duration: audioDuration,
                speedFactor: 1.0,
                originalDuration: audioDuration
            };
        }

        if (audioDuration < targetDuration) {
            const silenceDuration = targetDuration - audioDuration;
            console.log(`  Padding audio: ${audioDuration.toFixed(2)}s -> ${targetDuration.toFixed(2)}s`);

            return new Promise((resolve, reject) => {
                ffmpeg()
                    .input(audioPath)
                    .input('anullsrc=r=44100:cl=stereo')
                    .inputFormat('lavfi')
                    .complexFilter([
                        `[1:a]atrim=duration=${silenceDuration}[silence]`,
                        `[0:a][silence]concat=n=2:v=0:a=1[out]`
                    ])
                    .outputOptions(['-map', '[out]'])
                    .audioCodec('libmp3lame')
                    .output(fittedPath)
                    .on('end', () => resolve({ 
                        path: fittedPath, 
                        duration: targetDuration,
                        speedFactor: 1.0,
                        originalDuration: audioDuration
                    }))
                    .on('error', reject)
                    .run();
            });
        } else {
            // Audio is too long - calculate speed factor
            const speedFactor = audioDuration / targetDuration;
            const tempoFactor = Math.min(speedFactor, 2.0);
            
            console.log(`  ⚡ Speeding up audio: ${audioDuration.toFixed(2)}s -> ${targetDuration.toFixed(2)}s (${speedFactor.toFixed(2)}x speed)`);
            console.log(`  ⚡ Captions will also speed up ${speedFactor.toFixed(2)}x`);
            
            if (speedFactor > 2.0) {
                console.log(`  ⚠️  WARNING: Text very long for scene. Consider shortening or extending scene duration.`);
            }

            return new Promise((resolve, reject) => {
                ffmpeg()
                    .input(audioPath)
                    .audioFilters([`atempo=${tempoFactor.toFixed(3)}`])
                    .audioCodec('libmp3lame')
                    .duration(targetDuration)
                    .output(fittedPath)
                    .on('end', () => resolve({ 
                        path: fittedPath, 
                        duration: targetDuration,
                        speedFactor: speedFactor, // Return actual speed factor
                        originalDuration: audioDuration
                    }))
                    .on('error', reject)
                    .run();
            });
        }
    }

    async createSceneSegment(scene, sceneIndex, fps, style, dimensions, captionStyle) {
        const duration = scene.end - scene.start;
        const segmentPath = path.join(this.tempDir, `segment_${sceneIndex}.mp4`);

        console.log(`\n--- Scene ${sceneIndex + 1} ---`);
        console.log(`Duration: ${duration}s (${scene.start}s - ${scene.end}s)`);

        const { frames, frameCount } = await this.generateSceneFrames(
            scene.imagePrompt,
            duration,
            fps,
            style,
            dimensions,
            sceneIndex
        );

        const audioPath = path.join(this.audioDir, `voice_${sceneIndex}.mp3`);
        await this.generateVoiceover(scene.sceneContent, audioPath);

        // Get original audio duration
        const originalAudioDuration = await this.getAudioDuration(audioPath);
        
        // Fit audio to scene duration and get speed factor
        const fittedAudio = await this.fitAudioToLength(audioPath, duration);
        const speedFactor = fittedAudio.speedFactor;

        console.log(`  Original audio: ${originalAudioDuration.toFixed(2)}s`);
        console.log(`  Target duration: ${duration.toFixed(2)}s`);
        console.log(`  Speed factor: ${speedFactor.toFixed(2)}x`);

        const framePattern = path.join(
            this.framesDir,
            `scene${sceneIndex}_frame_%05d.png`
        );

        return new Promise((resolve, reject) => {
            // FIXED: Pass speedFactor to caption generation
            const captionFilters = this.buildVoiceSyncedCaptionFilters(
                scene.sceneContent,
                originalAudioDuration,
                speedFactor, // Pass speed factor here!
                captionStyle,
                dimensions
            );

            if (speedFactor > 1.0) {
                console.log(`  📝 Captions: Sped up ${speedFactor.toFixed(2)}x to match audio`);
            } else {
                console.log(`  📝 Captions: Normal speed (voice-synced)`);
            }

            ffmpeg()
                .input(framePattern)
                .inputOptions([
                    '-framerate', fps.toString(),
                    '-t', duration.toString()
                ])
                .input(fittedAudio.path)
                .outputOptions([
                    '-c:v', 'libx264',
                    '-pix_fmt', 'yuv420p',
                    '-r', fps.toString(),
                    '-crf', '20',
                    '-preset', 'medium',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-t', duration.toString()
                ])
                .videoFilters(captionFilters)
                .output(segmentPath)
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\rScene ${sceneIndex + 1}: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log(`\n✓ Scene ${sceneIndex + 1} completed`);
                    
                    // Verify the output file has audio
                    ffmpeg.ffprobe(segmentPath, (err, metadata) => {
                        if (err) {
                            console.error(`Error probing scene ${sceneIndex + 1}:`, err.message);
                            reject(err);
                            return;
                        }
                        
                        const hasAudio = metadata.streams.some(stream => stream.codec_type === 'audio');
                        if (!hasAudio) {
                            console.error(`Scene ${sceneIndex + 1} has no audio stream!`);
                            reject(new Error(`Scene ${sceneIndex + 1} has no audio stream`));
                            return;
                        }
                        
                        console.log(`Scene ${sceneIndex + 1} verified: has audio`);
                        resolve(segmentPath);
                    });
                })
                .on('error', (err) => {
                    console.error(`\nScene ${sceneIndex + 1} error:`, err.message);
                    reject(err);
                })
                .run();
        });
    }

    async mergeSegmentsWithTransitions(segmentPaths, scenes, outputName, transitionDuration = 0.6) {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(this.outputDir, outputName);

            console.log(`\n🎬 Merging ${segmentPaths.length} scenes...`);

            if (segmentPaths.length === 1) {
                fs.copyFileSync(segmentPaths[0], outputPath);
                console.log(`\n✅ Single scene video created`);
                resolve(outputPath);
                return;
            }

            let videoFilters = [];
            let audioFilters = [];
            
            let currentOffset = 0;
            
            for (let i = 0; i < segmentPaths.length - 1; i++) {
                const input1 = i === 0 ? '[0:v]' : `[v${i-1}]`;
                const input2 = `[${i+1}:v]`;
                const output = i === segmentPaths.length - 2 ? '[vout]' : `[v${i}]`;
                
                const sceneDuration = scenes[i].end - scenes[i].start;
                currentOffset += sceneDuration - (i === 0 ? transitionDuration : transitionDuration);
                
                videoFilters.push(
                    `${input1}${input2}xfade=transition=fade:duration=${transitionDuration}:offset=${currentOffset.toFixed(2)}${output}`
                );
            }

            const audioInputs = segmentPaths.map((_, i) => `[${i}:a]`).join('');
            audioFilters.push(`${audioInputs}concat=n=${segmentPaths.length}:v=0:a=1[aout]`);

            const allFilters = [...videoFilters, ...audioFilters];

            const command = ffmpeg();
            segmentPaths.forEach(seg => command.input(seg));

            command
                .complexFilter(allFilters)
                .outputOptions([
                    '-map', '[vout]',
                    '-map', '[aout]',
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-movflags', '+faststart'
                ])
                .output(outputPath)
                .on('progress', (progress) => {
                    if (progress.percent) {
                        process.stdout.write(`\rMerging: ${progress.percent.toFixed(1)}%`);
                    }
                })
                .on('end', () => {
                    console.log(`\n\n✅ Final video created: ${outputPath}`);
                    
                    // Verify the output file has audio
                    ffmpeg.ffprobe(outputPath, (err, metadata) => {
                        if (err) {
                            console.error('Error probing final video:', err.message);
                            reject(err);
                            return;
                        }
                        
                        const hasAudio = metadata.streams.some(stream => stream.codec_type === 'audio');
                        if (!hasAudio) {
                            console.error('Final video has no audio stream!');
                            reject(new Error('Final video has no audio stream'));
                            return;
                        }
                        
                        console.log(`📊 Duration: ${metadata.format.duration.toFixed(2)}s`);
                        console.log(`✅ Final video verified: has audio`);
                        resolve(outputPath);
                    });
                })
                .on('error', (err) => {
                    console.error('\nTransition merge failed, trying simple concat:', err.message);
                    this.mergeSegmentsSimple(segmentPaths, outputPath).then(resolve).catch(reject);
                })
                .run();
        });
    }

    async mergeSegmentsSimple(segmentPaths, outputPath) {
        return new Promise((resolve, reject) => {
            const concatFile = path.join(this.tempDir, 'concat.txt');
            const concatContent = segmentPaths
                .map(seg => `file '${path.resolve(seg).replace(/\\/g, '/')}'`)
                .join('\n');
            fs.writeFileSync(concatFile, concatContent);

            ffmpeg()
                .input(concatFile)
                .inputOptions(['-f', 'concat', '-safe', '0'])
                .outputOptions([
                    '-c:v', 'libx264',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-movflags', '+faststart'
                ])
                .output(outputPath)
                .on('end', () => {
                    console.log(`\n\n✅ Final video created: ${outputPath}`);
                    
                    // Verify the output file has audio
                    ffmpeg.ffprobe(outputPath, (err, metadata) => {
                        if (err) {
                            console.error('Error probing final video:', err.message);
                            reject(err);
                            return;
                        }
                        
                        const hasAudio = metadata.streams.some(stream => stream.codec_type === 'audio');
                        if (!hasAudio) {
                            console.error('Final video has no audio stream!');
                            reject(new Error('Final video has no audio stream'));
                            return;
                        }
                        
                        console.log(`📊 Duration: ${metadata.format.duration.toFixed(2)}s`);
                        console.log(`✅ Final video verified: has audio`);
                        resolve(outputPath);
                    });
                })
                .on('error', reject)
                .run();
        });
    }

    async generateVideoFromScenes(options = {}) {
        const {
            scenes = [],
            style = 'realistic',
            fps = 8,
            aspectRatio = '9:16',
            captionStyle = 'bold',
            transition = true,
            transitionDuration = 0.6,
            outputName = `video_${Date.now()}.mp4`
        } = options;

        if (!scenes || scenes.length === 0) {
            throw new Error('Scenes array is required');
        }

        scenes.sort((a, b) => a.start - b.start);

        for (const scene of scenes) {
            if (!scene.imagePrompt || !scene.sceneContent) {
                throw new Error('Each scene must have imagePrompt and sceneContent');
            }
            if (scene.start === undefined || scene.end === undefined) {
                throw new Error('Each scene must have start and end times');
            }
        }

        const dimensions = this.aspectRatios[aspectRatio];
        const stylePrompt = this.stylePresets[style] || style;
        const totalDuration = Math.max(...scenes.map(s => s.end));

        console.log('\n' + '='.repeat(70));
        console.log('🎥 AI VIDEO GENERATOR - VOICE-SYNCED CAPTIONS');
        console.log('='.repeat(70));
        console.log(`Scenes: ${scenes.length} | Duration: ${totalDuration}s | FPS: ${fps}`);
        console.log(`Aspect: ${aspectRatio} | Caption: ${captionStyle} (Voice-synced)`);
        console.log(`Transitions: ${transition ? 'Yes' : 'No'}`);
        console.log('='.repeat(70) + '\n');

        try {
            this.cleanupTemporaryFiles();

            const segmentPaths = [];
            for (let i = 0; i < scenes.length; i++) {
                const segmentPath = await this.createSceneSegment(
                    scenes[i],
                    i,
                    fps,
                    stylePrompt,
                    dimensions,
                    captionStyle
                );
                segmentPaths.push(segmentPath);
                
                if (i < scenes.length - 1) {
                    await this.delay(1000);
                }
            }

            const finalVideoPath = transition 
                ? await this.mergeSegmentsWithTransitions(segmentPaths, scenes, outputName, transitionDuration)
                : await this.mergeSegmentsSimple(segmentPaths, outputName);

            return {
                success: true,
                videoPath: finalVideoPath,
                fileName: outputName,
                totalDuration,
                sceneCount: scenes.length,
                fps,
                aspectRatio,
                dimensions,
                hasTransitions: transition,
                captionType: 'voice-synced'
            };

        } catch (error) {
            console.error('\n❌ Video generation failed:', error);
            throw error;
        }
    }

    cleanupTemporaryFiles() {
        const dirs = [this.framesDir, this.tempDir];
        dirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.readdirSync(dir).forEach(file => {
                    try {
                        fs.unlinkSync(path.join(dir, file));
                    } catch (e) {}
                });
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const generator = new AIVideoGenerator();

export async function generateVideoFromScenesHandler(generatedScript) {
    try {
        const scenes = generatedScript
        const style = 'realistic'
        const fps = 8
        const aspectRatio = '9:16'
        const captionStyle = 'bold'
        const transition = true
        const transitionDuration = 0.6

        if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
            return { error: 'Scenes array required' };
        }

        const result = await generator.generateVideoFromScenes({
            scenes,
            style,
            fps,
            aspectRatio,
            captionStyle,
            transition,
            transitionDuration: Math.min(0.75, Math.max(0.5, transitionDuration)),
            outputName: `video_${Date.now()}.mp4`
        });

        return {
            success: true,
            message: 'Video generated successfully with voice-synced captions',
            data: result,
            videoUrl: `/videos/${result.fileName}`
        };

    } catch (error) {
        console.error('API Error:', error);
        return {
            error: 'Video generation failed',
            details: error.message
        };
    }
};

app.get('/', (req, res) => {
    res.json({
        message: 'AI Video Generator - Voice-Synced Captions',
        version: '6.0.0',
        features: {
            voiceSyncedCaptions: 'Captions appear in sync with voice (3-5 words at a time)',
            accurateTiming: 'No delay between audio and captions',
            wordByWord: 'Text splits into phrases that match speech timing',
            audioFitting: 'Audio automatically fits scene duration',
            multipleTTSProviders: 'StreamElements, Google TTS, and local TTS as fallbacks'
        },
        example: 'Captions change every ~1 second as words are spoken'
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 AI Video Generator v6.0 - Voice-Synced Captions`);
    console.log(`${'='.repeat(70)}`);
    console.log(`\n✨ Captions sync with voice automatically`);
    console.log(`✨ Shows 3-5 words at a time as they're spoken`);
    console.log(`✅ Multiple TTS providers for reliability`);
    console.log(`✅ Audio verification at each step`);
    console.log(`\n${'='.repeat(70)}\n`);
});