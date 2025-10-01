// // const express = require('express');
// // const gtts = require('gtts');
// // const fs = require('fs');
// // const path = require('path');
// // const { v4: uuidv4 } = require('uuid');

// import express from 'express';
// import gtts from 'gtts';
// import fs from 'fs';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Create audio directory if it doesn't exist
// const audioDir = path.join(__dirname, 'audio');
// if (!fs.existsSync(audioDir)) {
//   fs.mkdirSync(audioDir);
// }

// // Serve static audio files
// app.use('/audio', express.static(audioDir));

// /**
//  * POST /api/tts
//  * Generate audio from text
//  * Body: {
//  *   text: string (required),
//  *   language: string (optional, default: 'en'),
//  *   slow: boolean (optional, default: false)
//  * }
//  */
// app.get('/api/tts/:language/:text', async (req, res) => {
//   try {
//     const { language = 'en', text, slow=false } = req.params;
//     // Validate input
//     if (!text || text.trim().length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Text is required'
//       });
//     }

//     if (text.length > 5000) {
//       return res.status(400).json({
//         success: false,
//         error: 'Text is too long. Maximum 5000 characters allowed'
//       });
//     }

//     // Generate unique filename
//     const filename = `${uuidv4()}.mp3`;
//     const filepath = path.join(audioDir, filename);

//     // Create gTTS instance
//     const speech = new gtts(text, language, slow);

//     // Save audio file
//     await new Promise((resolve, reject) => {
//       speech.save(filepath, (err) => {
//         if (err) reject(err);
//         else resolve();
//       });
//     });

//     // Get file stats
//     const stats = fs.statSync(filepath);
//     const audioUrl = `${req.protocol}://${req.get('host')}/audio/${filename}`;

//     // Return response
//     res.json({
//       success: true,
//       data: {
//         audioUrl,
//         filename,
//         size: stats.size,
//         text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
//         language,
//         slow
//       }
//     });

//   } catch (error) {
//     console.error('TTS Error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to generate audio',
//       message: error.message
//     });
//   }
// });

// /**
//  * POST /api/tts/download
//  * Generate and download audio file directly
//  */
// app.post('/api/tts/download', async (req, res) => {
//   try {
//     const { text, language = 'en', slow = false } = req.body;

//     if (!text || text.trim().length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Text is required'
//       });
//     }

//     const filename = `speech-${Date.now()}.mp3`;
//     const filepath = path.join(audioDir, filename);

//     const speech = new gtts(text, languageCode, slow);
//     
//     await new Promise((resolve, reject) => {
//       speech.save(filepath, (err) => {
//         if (err) reject(err);
//         else resolve();
//       });
//     });

//     // Send file as download
//     res.download(filepath, filename, (err) => {
//       if (err) {
//         console.error('Download error:', err);
//       }
//       // Delete file after download
//       setTimeout(() => {
//         if (fs.existsSync(filepath)) {
//           fs.unlinkSync(filepath);
//         }
//       }, 5000);
//     });

//   } catch (error) {
//     console.error('TTS Download Error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to generate audio',
//       message: error.message
//     });
//   }
// });

// /**
//  * GET /api/languages
//  * Get list of supported languages
//  */
// app.get('/api/languages', (req, res) => {
//   const languages = {
//     'af': 'Afrikaans',
//     'ar': 'Arabic',
//     'bn': 'Bengali',
//     'bs': 'Bosnian',
//     'ca': 'Catalan',
//     'cs': 'Czech',
//     'cy': 'Welsh',
//     'da': 'Danish',
//     'de': 'German',
//     'el': 'Greek',
//     'en': 'English',
//     'eo': 'Esperanto',
//     'es': 'Spanish',
//     'et': 'Estonian',
//     'fi': 'Finnish',
//     'fr': 'French',
//     'gu': 'Gujarati',
//     'hi': 'Hindi',
//     'hr': 'Croatian',
//     'hu': 'Hungarian',
//     'hy': 'Armenian',
//     'id': 'Indonesian',
//     'is': 'Icelandic',
//     'it': 'Italian',
//     'ja': 'Japanese',
//     'jw': 'Javanese',
//     'km': 'Khmer',
//     'kn': 'Kannada',
//     'ko': 'Korean',
//     'la': 'Latin',
//     'lv': 'Latvian',
//     'mk': 'Macedonian',
//     'ml': 'Malayalam',
//     'mr': 'Marathi',
//     'my': 'Myanmar',
//     'ne': 'Nepali',
//     'nl': 'Dutch',
//     'no': 'Norwegian',
//     'pl': 'Polish',
//     'pt': 'Portuguese',
//     'ro': 'Romanian',
//     'ru': 'Russian',
//     'si': 'Sinhala',
//     'sk': 'Slovak',
//     'sq': 'Albanian',
//     'sr': 'Serbian',
//     'su': 'Sundanese',
//     'sv': 'Swedish',
//     'sw': 'Swahili',
//     'ta': 'Tamil',
//     'te': 'Telugu',
//     'th': 'Thai',
//     'tl': 'Filipino',
//     'tr': 'Turkish',
//     'uk': 'Ukrainian',
//     'ur': 'Urdu',
//     'vi': 'Vietnamese',
//     'zh-CN': 'Chinese (Mandarin/China)',
//     'zh-TW': 'Chinese (Mandarin/Taiwan)'
//   };

//   res.json({
//     success: true,
//     languages
//   });
// });

// /**
//  * DELETE /api/audio/:filename
//  * Delete an audio file
//  */
// app.delete('/api/audio/:filename', (req, res) => {
//   try {
//     const { filename } = req.params;
//     const filepath = path.join(audioDir, filename);

//     if (fs.existsSync(filepath)) {
//       fs.unlinkSync(filepath);
//       res.json({
//         success: true,
//         message: 'Audio file deleted successfully'
//       });
//     } else {
//       res.status(404).json({
//         success: false,
//         error: 'Audio file not found'
//       });
//     }
//   } catch (error) {
//     console.error('Delete Error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to delete audio file'
//     });
//   }
// });

// // Health check
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', timestamp: new Date().toISOString() });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`🎤 TTS API Server running on port ${PORT}`);
//   console.log(`📝 POST http://localhost:${PORT}/api/tts - Generate audio`);
//   console.log(`⬇️  POST http://localhost:${PORT}/api/tts/download - Download audio`);
//   console.log(`🌍 GET  http://localhost:${PORT}/api/languages - List languages`);
// });















// import express from 'express';
// import gtts from 'gtts';
// import fs from 'fs';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();
// app.use(express.json());

// // Create output directory
// const outputDir = path.join(__dirname, 'audio_output');
// if (!fs.existsSync(outputDir)) {
//   fs.mkdirSync(outputDir, { recursive: true });
// }

// /**
//  * FREE Text-to-Speech (No API Key Required!)
//  * POST /api/text-to-speech
//  */
// app.post('/api/text-to-speech', async (req, res) => {
//   try {
//     const {
//       text,
//       languageCode = 'en',
//       slow = false
//     } = req.body;

//     if (!text) {
//       return res.status(400).json({ error: 'Text is required' });
//     }

//     // Generate unique filename
//     const timestamp = Date.now();
//     const filename = `speech_${timestamp}.mp3`;
//     const filepath = path.join(outputDir, filename);

//     // Create TTS instance
//     const speech = new gtts(text, languageCode, slow);

//     // Save to file
//     await new Promise((resolve, reject) => {
//       speech.save(filepath, (err) => {
//         if (err) reject(err);
//         else resolve();
//       });
//     });

//     res.json({
//       success: true,
//       message: 'Audio generated successfully',
//       filename,
//       downloadUrl: `/api/download/${filename}`,
//       audioUrl: `/api/audio/${filename}`
//     });

//   } catch (error) {
//     console.error('Error generating speech:', error);
//     res.status(500).json({
//       error: 'Failed to generate speech',
//       details: error.message
//     });
//   }
// });

// /**
//  * Stream audio directly (no file saved)
//  * POST /api/text-to-speech/stream
//  */
// app.post('/api/text-to-speech/stream', async (req, res) => {
//   try {
//     const {
//       text,
//       languageCode = 'en',
//       slow = false
//     } = req.body;

//     if (!text) {
//       return res.status(400).json({ error: 'Text is required' });
//     }

//     const speech = new gtts(languageCode, slow);

//     // Create temporary file
//     const tempFile = path.join(outputDir, `temp_${Date.now()}.mp3`);

//     await new Promise((resolve, reject) => {
//       speech.save(tempFile, (err) => {
//         if (err) reject(err);
//         else resolve();
//       });
//     });

//     // Set headers for audio streaming
//     res.set({
//       'Content-Type': 'audio/mpeg',
//       'Content-Disposition': 'inline; filename="speech.mp3"'
//     });

//     // Stream file and delete after
//     const stream = fs.createReadStream(tempFile);
//     stream.pipe(res);
//     stream.on('end', () => {
//       fs.unlinkSync(tempFile);
//     });

//   } catch (error) {
//     console.error('Error streaming speech:', error);
//     res.status(500).json({
//       error: 'Failed to stream speech',
//       details: error.message
//     });
//   }
// });

// /**
//  * Download generated audio file
//  * GET /api/download/:filename
//  */
// app.get('/api/download/:filename', (req, res) => {
//   const filename = req.params.filename;
//   const filepath = path.join(outputDir, filename);

//   if (!fs.existsSync(filepath)) {
//     return res.status(404).json({ error: 'File not found' });
//   }

//   res.download(filepath);
// });

// /**
//  * Stream audio file
//  * GET /api/audio/:filename
//  */
// app.get('/api/audio/:filename', (req, res) => {
//   const filename = req.params.filename;
//   const filepath = path.join(outputDir, filename);

//   if (!fs.existsSync(filepath)) {
//     return res.status(404).json({ error: 'File not found' });
//   }

//   res.set('Content-Type', 'audio/mpeg');
//   fs.createReadStream(filepath).pipe(res);
// });

// /**
//  * Batch TTS generation
//  * POST /api/text-to-speech/batch
//  */
// app.post('/api/text-to-speech/batch', async (req, res) => {
//   try {
//     const { texts, languageCode = 'en', slow = false } = req.body;

//     if (!texts || !Array.isArray(texts)) {
//       return res.status(400).json({ error: 'texts array is required' });
//     }

//     const results = [];

//     for (const text of texts) {
//       const timestamp = Date.now() + Math.random();
//       const filename = `speech_${timestamp}.mp3`;
//       const filepath = path.join(outputDir, filename);

//       const speech = new gtts(text, languageCode, slow);

//       await new Promise((resolve, reject) => {
//         speech.save(filepath, (err) => {
//           if (err) reject(err);
//           else resolve();
//         });
//       });

//       results.push({
//         text: text.substring(0, 50),
//         filename,
//         downloadUrl: `/api/download/${filename}`
//       });
//     }

//     res.json({
//       success: true,
//       count: results.length,
//       results
//     });

//   } catch (error) {
//     console.error('Batch error:', error);
//     res.status(500).json({
//       error: 'Batch generation failed',
//       details: error.message
//     });
//   }
// });

// /**
//  * Get available voices/languages
//  * GET /api/voices
//  */
// app.get('/api/voices', (req, res) => {
//   res.json({
//     languages: [
//       { code: 'en', name: 'English' },
//       { code: 'es', name: 'Spanish' },
//       { code: 'fr', name: 'French' },
//       { code: 'de', name: 'German' },
//       { code: 'it', name: 'Italian' },
//       { code: 'pt', name: 'Portuguese' },
//       { code: 'ru', name: 'Russian' },
//       { code: 'ja', name: 'Japanese' },
//       { code: 'ko', name: 'Korean' },
//       { code: 'zh-CN', name: 'Chinese (Simplified)' },
//       { code: 'zh-TW', name: 'Chinese (Traditional)' },
//       { code: 'ar', name: 'Arabic' },
//       { code: 'hi', name: 'Hindi' },
//       { code: 'tr', name: 'Turkish' },
//       { code: 'nl', name: 'Dutch' },
//       { code: 'pl', name: 'Polish' },
//       { code: 'sv', name: 'Swedish' },
//       { code: 'da', name: 'Danish' },
//       { code: 'no', name: 'Norwegian' },
//       { code: 'fi', name: 'Finnish' }
//     ]
//   });
// });

// /**
//  * List all audio files
//  * GET /api/files
//  */
// app.get('/api/files', (req, res) => {
//   try {
//     const files = fs.readdirSync(outputDir)
//       .filter(f => f.endsWith('.mp3'))
//       .map(f => {
//         const stats = fs.statSync(path.join(outputDir, f));
//         return {
//           filename: f,
//           size: stats.size,
//           created: stats.birthtime,
//           downloadUrl: `/api/download/${f}`,
//           audioUrl: `/api/audio/${f}`
//         };
//       });

//     res.json({
//       success: true,
//       count: files.length,
//       files
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to list files',
//       details: error.message
//     });
//   }
// });

// /**
//  * Delete audio file
//  * DELETE /api/files/:filename
//  */
// app.delete('/api/files/:filename', (req, res) => {
//   try {
//     const filename = req.params.filename;
//     const filepath = path.join(outputDir, filename);

//     if (!fs.existsSync(filepath)) {
//       return res.status(404).json({ error: 'File not found' });
//     }

//     fs.unlinkSync(filepath);
//     res.json({
//       success: true,
//       message: 'File deleted successfully'
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to delete file',
//       details: error.message
//     });
//   }
// });

// /**
//  * Health check endpoint
//  */
// app.get('/health', (req, res) => {
//   res.json({
//     status: 'OK',
//     service: 'Free TTS API',
//     timestamp: new Date().toISOString()
//   });
// });

// /**
//  * API Info
//  */
// app.get('/', (req, res) => {
//   res.json({
//     service: 'Free Text-to-Speech API',
//     version: '1.0.0',
//     features: ['No API key required', 'Unlimited usage', '20+ languages'],
//     endpoints: {
//       'POST /api/text-to-speech': 'Generate audio from text',
//       'POST /api/text-to-speech/stream': 'Stream audio directly',
//       'POST /api/text-to-speech/batch': 'Batch generate audio',
//       'GET /api/download/:filename': 'Download audio file',
//       'GET /api/audio/:filename': 'Stream audio file',
//       'GET /api/voices': 'Get available languages',
//       'GET /api/files': 'List all audio files',
//       'DELETE /api/files/:filename': 'Delete audio file',
//       'GET /health': 'Health check'
//     }
//   });
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🎙️  Free TTS API server running on port ${PORT}`);
//   console.log(`📝 API Info: http://localhost:${PORT}/`);
//   console.log(`💚 Health: http://localhost:${PORT}/health`);
//   console.log(`✅ No API key required - Unlimited usage!`);
// });


























// import express from 'express';
// // import gtts from 'gtts';
// // import fs from 'fs';
// // import path from 'path';
// // import { v4 as uuidv4 } from 'uuid';
// // import { fileURLToPath } from 'url';

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// const app = express();
// // app.use(express.json());


// import textToSpeech from '@google-cloud/text-to-speech';
// import fs from 'fs';
// import util from 'util';

// const client = new textToSpeech.TextToSpeechClient();

// app.post('/api/text-to-speech', async (req, res) => {
//     try {
//         const { text, languageCode = 'en-US', voiceName = 'en-US-Wavenet-D', gender = 'NEUTRAL' } = req.body;

//         if (!text) {
//             return res.status(400).json({ error: 'Text is required' });
//         }

//         const request = {
//             input: { text },
//             voice: {
//                 languageCode,
//                 name: voiceName,
//                 ssmlGender: gender
//             },
//             audioConfig: { audioEncoding: 'MP3' }
//         };

//         const [response] = await client.synthesizeSpeech(request);

//         const filename = `speech_${Date.now()}.mp3`;
//         const filepath = path.join(outputDir, filename);
//         await util.promisify(fs.writeFile)(filepath, response.audioContent, 'binary');

//         res.json({
//             success: true,
//             filename,
//             downloadUrl: `/api/download/${filename}`,
//             audioUrl: `/api/audio/${filename}`
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: 'TTS failed', details: err.message });
//     }
// });

























import express from 'express';
import textToSpeech from '@google-cloud/text-to-speech';
import fs from 'fs';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const client = new textToSpeech.TextToSpeechClient();

// Create output directory
const outputDir = path.join(__dirname, 'audio_output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// --- Your TTS endpoint ---
app.post('/api/text-to-speech', async (req, res) => {
    try {
        const { text, languageCode = 'en-US', voiceName = 'en-US-Wavenet-D', gender = 'NEUTRAL' } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const request = {
            input: { text },
            voice: {
                languageCode,
                name: voiceName,
                ssmlGender: gender
            },
            audioConfig: { audioEncoding: 'MP3' }
        };

        const [response] = await client.synthesizeSpeech(request);

        const filename = `speech_${Date.now()}.mp3`;
        const filepath = path.join(outputDir, filename);
        await util.promisify(fs.writeFile)(filepath, response.audioContent, 'binary');

        res.json({
            success: true,
            filename,
            downloadUrl: `/api/download/${filename}`,
            audioUrl: `/api/audio/${filename}`
        });
    } catch (err) {
        console.error('❌ Error generating speech:', err);
        res.status(500).json({ error: 'TTS failed', details: err.message });
    }
});

// --- Start the server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('====================================');
    console.log(`🚀 Server started successfully!`);
    console.log(`📡 Listening at: http://localhost:${PORT}/`);
    console.log(`📂 Audio files will be saved in: ${outputDir}`);
    console.log('====================================');
});
