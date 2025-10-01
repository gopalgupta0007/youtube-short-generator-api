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

// Initialize Google Cloud TTS client (requires API key)
const client = new textToSpeech.TextToSpeechClient();

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'audio_output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

/**
 * Main TTS API endpoint
 * POST /api/text-to-speech
 * Body: {
 *   text: string (required) - Text to convert to speech
 *   languageCode: string (optional) - Language code (default: 'en-US')
 *   voiceName: string (optional) - Voice name
 *   gender: string (optional) - 'MALE', 'FEMALE', 'NEUTRAL'
 *   audioEncoding: string (optional) - 'MP3', 'LINEAR16', 'OGG_OPUS'
 *   speakingRate: number (optional) - Speaking rate (0.25 to 4.0)
 *   pitch: number (optional) - Pitch (-20.0 to 20.0)
 * }
 */
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const {
      text,
      languageCode = 'en-US',
      voiceName,
      gender = 'NEUTRAL',
      audioEncoding = 'MP3',
      speakingRate = 1.0,
      pitch = 0.0
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Construct the request
    const request = {
      input: { text },
      voice: {
        languageCode,
        ssmlGender: gender,
        ...(voiceName && { name: voiceName })
      },
      audioConfig: {
        audioEncoding,
        speakingRate,
        pitch
      }
    };

    // Perform the text-to-speech request
    const [response] = await client.synthesizeSpeech(request);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `speech_${timestamp}.mp3`;
    const filepath = path.join(outputDir, filename);

    // Write the binary audio content to a file
    await util.promisify(fs.writeFile)(filepath, response.audioContent, 'binary');

    // Return the audio file
    res.json({
      success: true,
      message: 'Audio generated successfully',
      filename,
      downloadUrl: `/api/download/${filename}`,
      audioUrl: `/api/audio/${filename}`
    });

  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({
      error: 'Failed to generate speech',
      details: error.message
    });
  }
});

/**
 * Stream audio directly (no file saved)
 * POST /api/text-to-speech/stream
 */
app.post('/api/text-to-speech/stream', async (req, res) => {
  try {
    const {
      text,
      languageCode = 'en-US',
      gender = 'NEUTRAL',
      audioEncoding = 'MP3'
    } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const request = {
      input: { text },
      voice: { languageCode, ssmlGender: gender },
      audioConfig: { audioEncoding }
    };

    const [response] = await client.synthesizeSpeech(request);

    // Set appropriate headers
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'inline; filename="speech.mp3"'
    });

    // Send audio directly
    res.send(response.audioContent);

  } catch (error) {
    console.error('Error streaming speech:', error);
    res.status(500).json({
      error: 'Failed to stream speech',
      details: error.message
    });
  }
});

/**
 * Download generated audio file
 * GET /api/download/:filename
 */
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(outputDir, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filepath);
});

/**
 * Stream audio file
 * GET /api/audio/:filename
 */
app.get('/api/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(outputDir, filename);

  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.set('Content-Type', 'audio/mpeg');
  fs.createReadStream(filepath).pipe(res);
});

/**
 * Get available voices
 * GET /api/voices?languageCode=en-US
 */
app.get('/api/voices', async (req, res) => {
  try {
    const { languageCode } = req.query;
    const [result] = await client.listVoices({ languageCode });
    res.json({
      voices: result.voices
    });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({
      error: 'Failed to fetch voices',
      details: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`TTS API server running on port ${PORT}`);
  console.log(`Try: POST http://localhost:${PORT}/api/text-to-speech`);
});