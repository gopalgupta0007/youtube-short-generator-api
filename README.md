# AI Content Generation API Suite

A comprehensive API suite for generating AI-powered video content, including script generation, text-to-speech conversion, and text-to-video creation.

---

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [API 1: Script Generator (OpenAI)](#api-1-script-generator-openai)
4. [API 2: Text-to-Speech Generator (Google Cloud TTS)](#api-2-text-to-speech-generator-google-cloud-tts)
5. [API 3: AI Video Generator](#api-3-ai-video-generator)
6. [Complete Workflow Example](#complete-workflow-example)
7. [Troubleshooting](#troubleshooting)

[video-generation-demo.mp4](https://drive.google.com/file/d/1yIVf7vFZQLCga8rRMFUrZygu4-Oxidan/preview)
---

## Overview

This suite consists of three interconnected APIs:

- **Script Generator**: Generates multiple video scripts using OpenAI GPT-4
- **Text-to-Speech**: Converts scripts to audio using Google Cloud TTS
- **Video Generator**: Creates videos from text prompts using AI image generation

---

## Installation

### Prerequisites

```bash
# Node.js 16+ required
node --version

# Install dependencies
npm install express openai @google-cloud/text-to-speech axios fluent-ffmpeg sharp cors dotenv uuid
npm install ffmpeg-static ffprobe-static
```

### Environment Setup

Create a `.env` file:

```env
OPENAI_API_KEY=your_openai_api_key
PORT=3000
```

### Google Cloud TTS Setup

1. Create a Google Cloud project
2. Enable Text-to-Speech API
3. Download service account JSON credentials
4. Set environment variable:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/credentials.json"
```

---

## API 1: Script Generator (OpenAI)

### Description

Generates multiple video scripts based on a topic using OpenAI's GPT-4o-mini model.

### Endpoint

```
GET /
```

### Request

No body required. Script generation parameters are hardcoded in the route.

**Default Configuration:**
- Topic: "kids study"
- Duration: 30 seconds
- Number of scripts: 2

### Response Format

```json
{
  "scripts": [
    {
      "content": "Script 1 content here..."
    },
    {
      "content": "Script 2 content here..."
    }
  ]
}
```

### Example Usage

```bash
curl --location 'http://localhost:3001/api/generate-video/thursty crow Story'
```

### Expected Output

```json
{
  "scripts": [
    {
      "content": "[Scene: Bright, colorful study room]\n\nNarrator: \"Hey kids! Did you know that studying can be fun? Let's discover three amazing ways to make learning exciting!\"\n\n[Visual: Child reading with enthusiasm]\n\nNarrator: \"First, create a cozy study corner with your favorite colors. Second, use flashcards and games to remember facts. Third, take breaks to dance and stretch!\"\n\n[Visual: Kids celebrating success]\n\nNarrator: \"Remember, every small step counts. You're building your brain's superpower! Keep learning, keep growing!\""
    },
    {
      "content": "[Scene: Student at desk with books]\n\nNarrator: \"Learning is an adventure! Here's how to make studying super effective for kids.\"\n\n[Visual: Clock showing study schedule]\n\nNarrator: \"Set a regular study time each day. Break big tasks into small, manageable chunks. Use drawings and colors to remember information better.\"\n\n[Visual: Child high-fiving parent]\n\nNarrator: \"Ask questions, stay curious, and celebrate your progress. You're capable of amazing things!\""
    }
  ]
}
```

### Code Modifications Needed

**Current Issue**: The code has hardcoded parameters. Here's an improved version:

```javascript
app.post('/api/generate-scripts', async (req, res) => {
  try {
    const { topic = "kids study", duration = 30, count = 2 } = req.body;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: `Write ${count} different scripts for a ${duration} second video on Topic: ${topic}. 
                  Give me response in JSON format following this schema:
                  {
                    "scripts": [
                      {
                        "content": "script content here"
                      }
                    ]
                  }`
      }],
      response_format: { type: "json_object" }
    });
    
    const content = JSON.parse(response.choices[0].message.content);
    res.status(200).json(content);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to generate scripts" });
  }
});
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `topic` | string | No | "kids study" | Video topic |
| `duration` | number | No | 30 | Video duration in seconds |
| `count` | number | No | 2 | Number of scripts to generate |

---

## API 2: Text-to-Speech Generator (Google Cloud TTS)

### Description

Converts text scripts to high-quality speech audio files using Google Cloud Text-to-Speech.

### Endpoint

```
POST /api/text-to-speech
```

### Request Body

```json
{
  "text": "Your script content here",
  "languageCode": "en-US",
  "voiceName": "en-US-Wavenet-D",
  "gender": "NEUTRAL"
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | string | **Yes** | - | Text to convert to speech |
| `languageCode` | string | No | "en-US" | Language code (e.g., en-US, es-ES, fr-FR) |
| `voiceName` | string | No | "en-US-Wavenet-D" | Specific voice model |
| `gender` | string | No | "NEUTRAL" | Voice gender: MALE, FEMALE, NEUTRAL |

### Response Format

```json
{
  "success": true,
  "filename": "speech_1234567890.mp3",
  "downloadUrl": "/api/download/speech_1234567890.mp3",
  "audioUrl": "/api/audio/speech_1234567890.mp3"
}
```

### Example Usage

```bash
curl -X POST http://localhost:3000/api/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello! Welcome to our educational video about studying.",
    "languageCode": "en-US",
    "voiceName": "en-US-Wavenet-D",
    "gender": "NEUTRAL"
  }'
```

### Available Voice Options

#### English Voices
- `en-US-Wavenet-A` (MALE)
- `en-US-Wavenet-B` (MALE)
- `en-US-Wavenet-C` (FEMALE)
- `en-US-Wavenet-D` (MALE)
- `en-US-Wavenet-E` (FEMALE)
- `en-US-Wavenet-F` (FEMALE)

#### Other Languages
- Spanish: `es-ES-Wavenet-B`
- French: `fr-FR-Wavenet-A`
- German: `de-DE-Wavenet-A`
- Japanese: `ja-JP-Wavenet-A`

### Expected Output

**Response:**
```json
{
  "success": true,
  "filename": "speech_1704123456789.mp3",
  "downloadUrl": "/api/download/speech_1704123456789.mp3",
  "audioUrl": "/api/audio/speech_1704123456789.mp3"
}
```

**Audio File:**
- Format: MP3
- Quality: High-quality Google Wavenet
- Location: `./audio_output/` directory
- File size: ~30KB per 10 seconds of speech

---

## API 3: AI Video Generator

### Description

Generates complete videos from text prompts using AI image generation and FFmpeg video composition.

### Main Endpoint

```
POST /api/generate-video
```

### Request Body

```json
{
  "prompt": "a beautiful landscape",
  "style": "cinematic",
  "duration": 10,
  "fps": 2,
  "aspectRatio": "16:9",
  "transition": "smooth",
  "addMusic": false
}
```

### Parameters

| Parameter | Type | Required | Default | Range/Options | Description |
|-----------|------|----------|---------|---------------|-------------|
| `prompt` | string | **Yes** | - | - | Text description of video content |
| `style` | string | No | "cinematic" | See [Styles](#available-styles) | Visual style preset |
| `duration` | number | No | 10 | 3-60 seconds | Video length |
| `fps` | number | No | 2 | 1-10 | Frames per second |
| `aspectRatio` | string | No | "16:9" | See [Ratios](#aspect-ratios) | Video dimensions |
| `transition` | string | No | "smooth" | smooth, zoom, pan, time | Transition effect |
| `addMusic` | boolean | No | false | true/false | Add background music |

### Available Styles

```javascript
GET /api/styles
```

**Response:**
```json
{
  "styles": [
    "cinematic",
    "anime",
    "realistic",
    "artistic",
    "cyberpunk",
    "fantasy",
    "vintage",
    "minimalist",
    "watercolor",
    "comic"
  ],
  "descriptions": {
    "cinematic": "cinematic lighting, film grain, anamorphic, depth of field",
    "anime": "anime style, vibrant colors, studio ghibli, detailed animation",
    "realistic": "photorealistic, 8k, ultra detailed, professional photography",
    "artistic": "oil painting, impressionist, brush strokes, artistic",
    "cyberpunk": "cyberpunk, neon lights, futuristic, sci-fi, dark atmosphere",
    "fantasy": "fantasy art, magical, ethereal, epic, detailed illustration",
    "vintage": "vintage film, retro, 1980s aesthetic, nostalgic",
    "minimalist": "minimalist, clean, simple, modern design",
    "watercolor": "watercolor painting, soft colors, artistic, dreamy",
    "comic": "comic book style, bold lines, pop art, vibrant"
  }
}
```

### Aspect Ratios

```javascript
GET /api/aspect-ratios
```

**Response:**
```json
{
  "aspectRatios": {
    "16:9": { "width": 1920, "height": 1080, "use": "YouTube, Landscape" },
    "9:16": { "width": 1080, "height": 1920, "use": "TikTok, Instagram Stories" },
    "1:1": { "width": 1080, "height": 1080, "use": "Instagram Posts" },
    "4:3": { "width": 1024, "height": 768, "use": "Classic TV" },
    "21:9": { "width": 2560, "height": 1080, "use": "Cinematic Ultrawide" }
  }
}
```

### Transition Types

```javascript
GET /api/transitions
```

**Response:**
```json
{
  "transitions": ["smooth", "zoom", "pan", "time"],
  "descriptions": {
    "smooth": "Smooth camera angle transitions",
    "zoom": "Zoom in/out effect",
    "pan": "Left to right panning",
    "time": "Time progression (dawn to night)"
  }
}
```

### Example Usage

#### Basic Video Generation

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "sunset over ocean waves"
  }'
```

#### Advanced YouTube Video

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "chef cooking in modern kitchen",
    "style": "realistic",
    "duration": 20,
    "fps": 3,
    "aspectRatio": "16:9",
    "transition": "smooth"
  }'
```

#### TikTok/Instagram Story (Vertical)

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "fashion model on runway",
    "style": "cinematic",
    "duration": 8,
    "fps": 2,
    "aspectRatio": "9:16",
    "transition": "zoom"
  }'
```

### Response Format

```json
{
  "success": true,
  "message": "Video generated successfully",
  "data": {
    "videoPath": "./output/video_1704123456789.mp4",
    "fileName": "video_1704123456789.mp4",
    "duration": 10,
    "frameCount": 20,
    "fps": 2,
    "aspectRatio": "16:9",
    "dimensions": {
      "width": 1920,
      "height": 1080
    }
  },
  "videoUrl": "/videos/video_1704123456789.mp4"
}
```

### Expected Output

**Video File Specifications:**
- Format: MP4 (H.264)
- Quality: High (CRF 23)
- Location: `./output/` directory
- Codec: libx264
- Pixel Format: yuv420p
- File size: ~2-5MB per 10 seconds (varies with resolution)

**Generation Time:**
- 10 seconds @ 2fps: ~40-60 seconds
- 20 seconds @ 3fps: ~2-3 minutes
- 30 seconds @ 4fps: ~4-5 minutes

---

## Complete Workflow Example

### Step 1: Generate Scripts

```bash
curl -X POST http://localhost:3000/api/generate-scripts \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "learning mathematics",
    "duration": 30,
    "count": 2
  }'
```

**Response:**
```json
{
  "scripts": [
    {
      "content": "Math is everywhere! From counting cookies to measuring ingredients..."
    }
  ]
}
```

### Step 2: Convert Script to Audio

```bash
curl -X POST http://localhost:3000/api/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Math is everywhere! From counting cookies to measuring ingredients...",
    "languageCode": "en-US",
    "voiceName": "en-US-Wavenet-D"
  }'
```

**Response:**
```json
{
  "success": true,
  "filename": "speech_1704123456.mp3",
  "downloadUrl": "/api/download/speech_1704123456.mp3"
}
```

### Step 3: Generate Video

```bash
curl -X POST http://localhost:3000/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "children learning mathematics with colorful numbers",
    "style": "cartoon",
    "duration": 30,
    "fps": 2,
    "aspectRatio": "16:9"
  }'
```

**Response:**
```json
{
  "success": true,
  "videoUrl": "/videos/video_1704123456.mp4",
  "data": {
    "duration": 30,
    "frameCount": 60,
    "fps": 2
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. FFmpeg Not Found

**Error:** `Cannot find ffmpeg`

**Solution:**
```bash
npm install ffmpeg-static ffprobe-static
```

Then add to your code:
```javascript
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);
```

#### 2. Google Cloud Authentication

**Error:** `Could not load the default credentials`

**Solution:**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
```

#### 3. OpenAI API Key Invalid

**Error:** `Invalid API key`

**Solution:**
- Verify your API key is correct
- Check if key has been rotated
- Ensure key has sufficient credits

#### 4. Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Performance Tips

1. **Video Generation:**
   - Use FPS 2-3 for optimal balance
   - Lower duration for faster generation
   - "realistic" style takes longer than "minimalist"

2. **Audio Generation:**
   - Wavenet voices are higher quality but slower
   - Standard voices are faster for testing

3. **Script Generation:**
   - GPT-4o-mini is faster and cheaper than GPT-4
   - Reduce token count for faster responses

---

## API Endpoints Summary

| Service | Method | Endpoint | Purpose |
|---------|--------|----------|---------|
| **Script Generator** | POST | `/api/generate-scripts` | Generate video scripts |
| **TTS** | POST | `/api/text-to-speech` | Convert text to audio |
| **Video** | POST | `/api/generate-video` | Generate AI video |
| **Video** | GET | `/api/styles` | List available styles |
| **Video** | GET | `/api/aspect-ratios` | List aspect ratios |
| **Video** | GET | `/api/transitions` | List transitions |
| **Video** | GET | `/api/features` | Complete documentation |

---

## License

MIT License - Feel free to use in your projects!

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review API documentation above
- Ensure all dependencies are installed correctly

---


**Last Updated:** October 2025
