// AI Video Generator - Voice-Synced Captions
// Install: npm install express axios fluent-ffmpeg sharp cors say

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

// ═══════════════════════════════════════════════════════════════
// FREE IMAGE PROVIDERS — Zero tokens, Zero API keys
// ═══════════════════════════════════════════════════════════════
const IMAGE_PROVIDERS = [
    {
        name: 'Pollinations FLUX',
        generate: async (prompt, width, height, seed) => {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=${width}&height=${height}&seed=${seed}&nologo=true`;
            return await fetchImageBuffer(url, 60000);
        }
    },
    {
        name: 'Pollinations Flux-Realism',
        generate: async (prompt, width, height, seed) => {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux-realism&width=${width}&height=${height}&seed=${seed}&nologo=true`;
            return await fetchImageBuffer(url, 60000);
        }
    },
    {
        name: 'Pollinations Turbo',
        generate: async (prompt, width, height, seed) => {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=turbo&width=${width}&height=${height}&seed=${seed}&nologo=true`;
            return await fetchImageBuffer(url, 45000);
        }
    },
    {
        name: 'Pollinations Dreamshaper',
        generate: async (prompt, width, height, seed) => {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=dreamshaper&width=${width}&height=${height}&seed=${seed}&nologo=true`;
            return await fetchImageBuffer(url, 60000);
        }
    },
    {
        name: 'Pollinations Any-Dark',
        generate: async (prompt, width, height, seed) => {
            const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=any-dark&width=${width}&height=${height}&seed=${seed}&nologo=true`;
            return await fetchImageBuffer(url, 60000);
        }
    },
    {
        name: 'Stable Horde (Anonymous)',
        generate: async (prompt, width, height, seed) => {
            return await generateStableHorde(prompt, width, height, seed);
        }
    },
    {
        name: 'Craiyon',
        generate: async (prompt, width, height, _seed) => {
            return await generateCraiyon(prompt, width, height);
        }
    }
];

// ─── Shared HTTP image fetch ──────────────────────────────────────────────────
async function fetchImageBuffer(url, timeout = 60000) {
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    return validateImageBuffer(Buffer.from(response.data));
}

function validateImageBuffer(buffer) {
    if (!buffer || buffer.length < 5000)
        throw new Error(`Buffer too small: ${buffer?.length ?? 0} bytes`);
    const isPNG  = buffer[0] === 0x89 && buffer[1] === 0x50;
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
    const isWEBP = buffer.length > 12 && buffer.toString('ascii', 8, 12) === 'WEBP';
    if (!isPNG && !isJPEG && !isWEBP)
        throw new Error('Not a valid image (PNG/JPEG/WEBP)');
    return buffer;
}

// ─── Stable Horde ─────────────────────────────────────────────────────────────
async function generateStableHorde(prompt, width, height, seed) {
    const w = Math.min(1024, Math.round(width / 64) * 64);
    const h = Math.min(1024, Math.round(height / 64) * 64);
    console.log(`    [Stable Horde] Submitting ${w}x${h}...`);
    const submitRes = await axios.post(
        'https://stablehorde.net/api/v2/generate/async',
        {
            prompt,
            params: { width: w, height: h, steps: 20, cfg_scale: 7, seed: String(seed), sampler_name: 'k_euler_a', n: 1 },
            models: ['stable_diffusion'],
            r2: true
        },
        { headers: { 'Content-Type': 'application/json', 'apikey': '0000000000' }, timeout: 15000 }
    );
    const jobId = submitRes.data.id;
    console.log(`    [Stable Horde] Job: ${jobId} — polling...`);
    for (let i = 0; i < 36; i++) {
        await delay(5000);
        const check = await axios.get(`https://stablehorde.net/api/v2/generate/check/${jobId}`, { timeout: 10000 });
        const { done, queue_position, wait_time } = check.data;
        console.log(`    [Stable Horde] Queue: ${queue_position ?? '?'} | ~${wait_time ?? '?'}s`);
        if (done) {
            const result = await axios.get(`https://stablehorde.net/api/v2/generate/status/${jobId}`, { timeout: 10000 });
            const generations = result.data.generations;
            if (!generations?.length) throw new Error('No generations returned');
            const imgBuffer = await fetchImageBuffer(generations[0].img, 30000);
            console.log(`    [Stable Horde] ✅ Done!`);
            return imgBuffer;
        }
    }
    throw new Error('Stable Horde timed out (3 min)');
}

// ─── Craiyon ──────────────────────────────────────────────────────────────────
async function generateCraiyon(prompt, width, height) {
    console.log(`    [Craiyon] Submitting...`);
    const res = await axios.post(
        'https://backend.craiyon.com/generate',
        { prompt, negative_prompt: '', model: 'art', token: null },
        { headers: { 'Content-Type': 'application/json' }, timeout: 120000 }
    );
    const images = res.data.images;
    if (!images?.length) throw new Error('No images returned from Craiyon');
    const buffer = Buffer.from(images[0], 'base64');
    if (buffer.length < 5000) throw new Error('Craiyon image too small');
    console.log(`    [Craiyon] ✅ Got image (${(buffer.length / 1024).toFixed(0)}KB)`);
    return buffer;
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════
// TTS PROVIDERS — Waterfall: first success wins
// ═══════════════════════════════════════════════════════════════

// Split long text into word-boundary chunks for APIs with char limits
function chunkText(text, maxLen) {
    const words = text.split(' ');
    const chunks = [];
    let current = '';
    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (next.length > maxLen && current) { chunks.push(current.trim()); current = word; }
        else current = next;
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length ? chunks : [text];
}

const TTS_PROVIDERS = [
    {
        name: 'StreamElements (Brian)',
        generate: async (text, outputPath) => {
            const r = await axios.get('https://api.streamelements.com/kappa/v2/speech', {
                params: { voice: 'Brian', text },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            if (!r.data || r.data.byteLength < 1000) throw new Error('Response too small');
            fs.writeFileSync(outputPath, Buffer.from(r.data));
        }
    },
    {
        name: 'TikTok TTS',
        generate: async (text, outputPath) => {
            // TikTok TTS has ~200 char limit — chunk and concatenate raw mp3 buffers
            const chunks  = chunkText(text, 175);
            const buffers = [];
            for (const chunk of chunks) {
                const r = await axios.post(
                    'https://tiktok-tts.weilnet.workers.dev/api/generation',
                    { text: chunk, voice: 'en_us_006' },
                    { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
                );
                if (!r.data?.success || !r.data?.data) throw new Error('TikTok TTS API error');
                buffers.push(Buffer.from(r.data.data, 'base64'));
            }
            const combined = Buffer.concat(buffers);
            if (combined.length < 1000) throw new Error('Output too small');
            fs.writeFileSync(outputPath, combined);
        }
    },
    {
        name: 'Google TTS',
        generate: async (text, outputPath) => {
            // Google Translate TTS has ~200 char limit — chunk and concatenate
            const chunks  = chunkText(text, 175);
            const buffers = [];
            for (const chunk of chunks) {
                const r = await axios.get('https://translate.google.com/translate_tts', {
                    params: { ie: 'UTF-8', q: chunk, tl: 'en', client: 'tw-ob' },
                    responseType: 'arraybuffer',
                    timeout: 20000,
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                if (!r.data || r.data.byteLength < 500) throw new Error('Chunk too small');
                buffers.push(Buffer.from(r.data));
            }
            const combined = Buffer.concat(buffers);
            if (combined.length < 1000) throw new Error('Output too small');
            fs.writeFileSync(outputPath, combined);
        }
    },
    {
        name: 'Hugging Face MMS-TTS',
        generate: async (text, outputPath) => {
            const r = await axios.post(
                'https://api-inference.huggingface.co/models/facebook/mms-tts-eng',
                { inputs: text },
                { responseType: 'arraybuffer', timeout: 45000, headers: { 'Content-Type': 'application/json' } }
            );
            if (!r.data || r.data.byteLength < 1000) throw new Error('Response too small');
            // HF returns WAV — convert to MP3 via FFmpeg
            const wavPath = outputPath.replace('.mp3', '_hf_mms.wav');
            fs.writeFileSync(wavPath, Buffer.from(r.data));
            await new Promise((res, rej) => {
                ffmpeg(wavPath).audioCodec('libmp3lame').audioBitrate('192k')
                    .output(outputPath).on('end', res).on('error', rej).run();
            });
            try { fs.unlinkSync(wavPath); } catch { }
        }
    },
    {
        name: 'Hugging Face SpeechT5',
        generate: async (text, outputPath) => {
            const r = await axios.post(
                'https://api-inference.huggingface.co/models/microsoft/speecht5_tts',
                { inputs: text },
                { responseType: 'arraybuffer', timeout: 45000, headers: { 'Content-Type': 'application/json' } }
            );
            if (!r.data || r.data.byteLength < 1000) throw new Error('Response too small');
            const wavPath = outputPath.replace('.mp3', '_hf_st5.wav');
            fs.writeFileSync(wavPath, Buffer.from(r.data));
            await new Promise((res, rej) => {
                ffmpeg(wavPath).audioCodec('libmp3lame').audioBitrate('192k')
                    .output(outputPath).on('end', res).on('error', rej).run();
            });
            try { fs.unlinkSync(wavPath); } catch { }
        }
    },
    {
        name: 'StreamElements (Amy)',
        // Second StreamElements voice as additional fallback
        generate: async (text, outputPath) => {
            const r = await axios.get('https://api.streamelements.com/kappa/v2/speech', {
                params: { voice: 'Amy', text },
                responseType: 'arraybuffer',
                timeout: 30000
            });
            if (!r.data || r.data.byteLength < 1000) throw new Error('Response too small');
            fs.writeFileSync(outputPath, Buffer.from(r.data));
        }
    },
    {
        name: 'Local System TTS (say)',
        generate: async (text, outputPath) => {
            await sayExport(text, null, null, outputPath);
            if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 500)
                throw new Error('say output missing or too small');
        }
    }
];

// ═══════════════════════════════════════════════════════════════
// VIDEO GENERATOR CLASS
// ═══════════════════════════════════════════════════════════════
class AIVideoGenerator {
    constructor() {
        this.outputDir = './output';
        this.framesDir = './frames';
        this.audioDir  = './audio';
        this.tempDir   = './temp';

        this.aspectRatios = {
            '16:9': { width: 1920, height: 1080 },
            '9:16': { width: 1080, height: 1920 },
            '1:1':  { width: 1080, height: 1080 },
            '4:3':  { width: 1024, height: 768  },
            '21:9': { width: 2560, height: 1080 },
        };

        this.genResolutions = {
            '16:9': { width: 1024, height: 576  },
            '9:16': { width: 576,  height: 1024 },
            '1:1':  { width: 1024, height: 1024 },
            '4:3':  { width: 1024, height: 768  },
            '21:9': { width: 1024, height: 448  },
        };

        this.stylePresets = {
            cinematic:  'cinematic lighting, film grain, anamorphic, depth of field',
            anime:      'anime style, vibrant colors, studio ghibli, detailed animation',
            realistic:  'photorealistic, 8k, ultra detailed, professional photography',
            artistic:   'oil painting, impressionist, brush strokes, artistic',
            cyberpunk:  'cyberpunk, neon lights, futuristic, sci-fi, dark atmosphere',
            fantasy:    'fantasy art, magical, ethereal, epic, detailed illustration',
            vintage:    'vintage film, retro, 1980s aesthetic, nostalgic',
            minimalist: 'minimalist, clean, simple, modern design',
            watercolor: 'watercolor painting, soft colors, artistic, dreamy',
            comic:      'comic book style, bold lines, pop art, vibrant'
        };

        this.getCaptionStyle = (name, dims) => {
            const S = {
                default: { fontsize: 48, fontcolor: 'white',  shadowcolor: 'black',     shadowx: 3, shadowy: 3, box: true, boxcolor: 'black@0.75', marginBottom: 140 },
                bold:    { fontsize: 54, fontcolor: 'white',  shadowcolor: 'black',     shadowx: 4, shadowy: 4, box: true, boxcolor: 'black@0.8',  marginBottom: 150 },
                modern:  { fontsize: 52, fontcolor: 'yellow', shadowcolor: 'black',     shadowx: 3, shadowy: 3, box: true, boxcolor: 'black@0.8',  marginBottom: 145 },
                elegant: { fontsize: 46, fontcolor: 'white',  shadowcolor: 'navy',      shadowx: 3, shadowy: 3, box: true, boxcolor: 'navy@0.75',  marginBottom: 135 },
                vibrant: { fontsize: 50, fontcolor: 'cyan',   shadowcolor: 'black',     shadowx: 4, shadowy: 4, box: true, boxcolor: 'black@0.85', marginBottom: 148 },
                gaming:  { fontsize: 48, fontcolor: 'lime',   shadowcolor: 'darkgreen', shadowx: 3, shadowy: 3, box: true, boxcolor: 'black@0.8',  marginBottom: 142 }
            };
            const s = S[name] || S.default;
            s.maxWidth = Math.floor(dims.width * 0.92);
            if      (dims.width < 720)  { s.fontsize = Math.floor(s.fontsize * 0.70); s.marginBottom = 100; }
            else if (dims.width < 1080) { s.fontsize = Math.floor(s.fontsize * 0.85); s.marginBottom = 120; }
            return s;
        };

        [this.outputDir, this.framesDir, this.audioDir, this.tempDir].forEach(d => {
            if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
        });
    }

    // ── IMAGE GENERATION ──────────────────────────────────────────────────────
    async generateImage(prompt, style, seed, dimensions, aspectRatio = '9:16') {
        const fullPrompt = style ? `${prompt}, ${style}` : prompt;
        const genRes = this.genResolutions[aspectRatio] || { width: 768, height: 768 };

        console.log(`\n🖼️  Image: "${prompt.substring(0, 60)}..."`);
        console.log(`    API res: ${genRes.width}×${genRes.height} → upscale to ${dimensions.width}×${dimensions.height}`);

        for (const provider of IMAGE_PROVIDERS) {
            try {
                console.log(`    🔄 [${provider.name}]`);
                const raw   = await provider.generate(fullPrompt, genRes.width, genRes.height, seed);
                const final = await sharp(raw)
                    .resize(dimensions.width, dimensions.height, { fit: 'cover', position: 'center', kernel: 'lanczos3' })
                    .toBuffer();
                console.log(`    ✅ [${provider.name}] OK (${(final.length / 1024).toFixed(0)}KB)`);
                return final;
            } catch (err) {
                console.log(`    ❌ [${provider.name}]: ${err.message}`);
            }
        }

        console.log('    ⚠️  All image providers failed — gradient placeholder');
        return this.createGradientPlaceholder(prompt, dimensions);
    }

    async createGradientPlaceholder(prompt, dimensions) {
        const hash = [...prompt].reduce((a, c) => a + c.charCodeAt(0), 0);
        const h1 = hash % 360, h2 = (h1 + 50) % 360;
        const hslToHex = h => {
            const s = 0.5, l = 0.35;
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            return [h / 360 + 1 / 3, h / 360, h / 360 - 1 / 3].map(t => {
                if (t < 0) t += 1; if (t > 1) t -= 1;
                const v = t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
                return Math.round(v * 255).toString(16).padStart(2, '0');
            }).join('');
        };
        const lines = (prompt.match(/.{1,32}(\s|$)/g) ?? [prompt]).slice(0, 3).map(l => l.trim());
        const rows  = lines.map((l, i) => `<text x="50%" y="${48 + i * 9}%" font-family="Arial" font-size="38" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">${l.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))}</text>`).join('');
        const svg   = `<svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#${hslToHex(h1)}"/><stop offset="100%" stop-color="#${hslToHex(h2)}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><rect x="5%" y="38%" width="90%" height="30%" rx="16" fill="rgba(0,0,0,0.42)"/>${rows}</svg>`;
        return await sharp(Buffer.from(svg)).png().toBuffer();
    }

    // ── SCENE FRAMES (Ken Burns) ──────────────────────────────────────────────
    async generateSceneFrames(prompt, duration, fps, style, dimensions, idx, aspectRatio) {
        const n    = Math.ceil(duration * fps);
        const seed = Math.floor(Math.random() * 1_000_000);
        const base = await this.generateImage(prompt, style, seed, dimensions, aspectRatio);

        for (let i = 0; i < n; i++) {
            const fp = path.join(this.framesDir, `scene${idx}_frame_${String(i).padStart(5, '0')}.png`);
            const p  = i / Math.max(1, n - 1);
            const sc = 1.0 + p * 0.04;
            const sw = Math.floor(dimensions.width  * sc);
            const sh = Math.floor(dimensions.height * sc);
            await sharp(base)
                .resize(sw, sh, { fit: 'cover', position: 'center', kernel: 'lanczos3' })
                .extract({
                    left:   Math.max(0, Math.min(sw - dimensions.width,  Math.floor(Math.abs(Math.sin(p * Math.PI) * 12)))),
                    top:    Math.max(0, Math.min(sh - dimensions.height, Math.floor(Math.abs(Math.cos(p * Math.PI * 0.5) * 6)))),
                    width:  dimensions.width,
                    height: dimensions.height
                })
                .toFile(fp);
        }
        return n;
    }

    // ── VOICEOVER — waterfall through all TTS providers ───────────────────────
    async generateVoiceover(text, outputPath) {
        const clean = text.replace(/\\n|\n/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`🎙️  TTS: "${clean.substring(0, 60)}..."`);

        for (const provider of TTS_PROVIDERS) {
            try {
                console.log(`    🔄 TTS [${provider.name}]`);
                // Clean up any partial file from a previous failed attempt
                try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch { }

                await provider.generate(clean, outputPath);

                if (!fs.existsSync(outputPath)) throw new Error('Output file not created');
                const size = fs.statSync(outputPath).size;
                if (size < 1000) throw new Error(`Output too small: ${size} bytes`);

                console.log(`    ✅ TTS [${provider.name}] OK (${(size / 1024).toFixed(0)}KB)`);
                return outputPath;
            } catch (err) {
                console.log(`    ❌ TTS [${provider.name}]: ${err.message}`);
                try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch { }
            }
        }

        // All providers failed — generate silence so video still renders
        const estDuration = Math.max(3, clean.split(' ').length * 0.4);
        console.log(`    ⚠️  All TTS failed — ${estDuration.toFixed(1)}s silence fallback`);
        return this.createSilentAudio(outputPath, estDuration);
    }

    createSilentAudio(outputPath, duration) {
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input('anullsrc=r=44100:cl=stereo').inputFormat('lavfi').duration(duration)
                .audioCodec('libmp3lame').output(outputPath)
                .on('end', () => resolve(outputPath)).on('error', reject).run();
        });
    }

    // ── CAPTIONS ─────────────────────────────────────────────────────────────
    buildVoiceSyncedCaptionFilters(text, audioDuration, speedFactor, styleName, dimensions) {
        const cs    = this.getCaptionStyle(styleName, dimensions);
        const clean = text.replace(/\\n|\n/g, ' ').replace(/\s+/g, ' ').trim();
        const words = clean.split(' ');
        const tpw   = (audioDuration / speedFactor) / words.length;
        const wpf   = speedFactor > 1.5 ? 3 : speedFactor > 1.2 ? 4 : 5;

        const phrases = [];
        for (let i = 0; i < words.length; i += wpf) {
            const chunk = words.slice(i, i + wpf);
            phrases.push({ text: chunk.join(' '), start: i * tpw, end: (i + chunk.length) * tpw });
        }

        return phrases.map(ph => {
            const maxCpl = Math.floor(cs.maxWidth / (cs.fontsize * 0.5));
            const lines = []; let cur = '';
            for (const w of ph.text.split(' ')) {
                const t = cur + (cur ? ' ' : '') + w;
                if (t.length > maxCpl && cur) { lines.push(cur); cur = w; } else cur = t;
            }
            if (cur) lines.push(cur);
            const disp = lines.slice(0, dimensions.height > dimensions.width ? 2 : 3).join('\\n');
            const esc  = disp.replace(/'/g, "'\\''").replace(/:/g, '\\:').replace(/,/g, '\\,');
            let f = `drawtext=text='${esc}':fontsize=${cs.fontsize}:fontcolor=${cs.fontcolor}:x=(w-text_w)/2:y=h-text_h-${cs.marginBottom}:shadowcolor=${cs.shadowcolor}:shadowx=${cs.shadowx}:shadowy=${cs.shadowy}:`;
            if (cs.box) f += `box=1:boxcolor=${cs.boxcolor}:boxborderw=25:`;
            f += `enable='between(t\\,${ph.start.toFixed(2)}\\,${ph.end.toFixed(2)})'`;
            return f;
        }).join(',');
    }

    // ── AUDIO UTILS ───────────────────────────────────────────────────────────
    getAudioDuration(p) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(p))         { reject(new Error(`Missing: ${p}`));   return; }
            if (fs.statSync(p).size < 100) { reject(new Error('Audio too small')); return; }
            ffmpeg.ffprobe(p, (err, meta) => {
                if (err || !meta?.format?.duration) reject(err ?? new Error('Bad metadata'));
                else resolve(meta.format.duration);
            });
        });
    }

    async fitAudioToLength(audioPath, target) {
        const dur    = await this.getAudioDuration(audioPath);
        const fitted = audioPath.replace('.mp3', '_fitted.mp3');
        if (Math.abs(dur - target) < 0.1)
            return { path: audioPath, duration: dur, speedFactor: 1.0, originalDuration: dur };

        if (dur < target) {
            return new Promise((resolve, reject) => {
                ffmpeg()
                    .input(audioPath)
                    .input('anullsrc=r=44100:cl=stereo').inputFormat('lavfi')
                    .complexFilter([`[1:a]atrim=duration=${target - dur}[s]`, `[0:a][s]concat=n=2:v=0:a=1[out]`])
                    .outputOptions(['-map', '[out]']).audioCodec('libmp3lame').output(fitted)
                    .on('end', () => resolve({ path: fitted, duration: target, speedFactor: 1.0, originalDuration: dur }))
                    .on('error', reject).run();
            });
        }

        const sf = dur / target;
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(audioPath)
                .audioFilters([`atempo=${Math.min(sf, 2.0).toFixed(3)}`])
                .audioCodec('libmp3lame').duration(target).output(fitted)
                .on('end', () => resolve({ path: fitted, duration: target, speedFactor: sf, originalDuration: dur }))
                .on('error', reject).run();
        });
    }

    // ── SCENE SEGMENT ─────────────────────────────────────────────────────────
    // Returns { segmentPath, fittedAudioPath }
    // The fittedAudioPath is passed directly to _mergeAudioOnly so we never
    // have to demux audio from the MP4 — which was the cause of silence.
    async createSceneSegment(scene, idx, fps, style, dimensions, captionStyle, aspectRatio) {
        const duration    = scene.end - scene.start;
        const segmentPath = path.join(this.tempDir, `segment_${idx}.mp4`);
        console.log(`\n${'─'.repeat(50)}\n🎬 Scene ${idx + 1} — ${duration}s`);

        await this.generateSceneFrames(scene.imagePrompt, duration, fps, style, dimensions, idx, aspectRatio);

        const audioPath = path.join(this.audioDir, `voice_${idx}.mp3`);
        await this.generateVoiceover(scene.sceneContent, audioPath);

        const origDur  = await this.getAudioDuration(audioPath);
        const fitted   = await this.fitAudioToLength(audioPath, duration);
        const captions = this.buildVoiceSyncedCaptionFilters(
            scene.sceneContent, origDur, fitted.speedFactor, captionStyle, dimensions
        );
        const pattern = path.join(this.framesDir, `scene${idx}_frame_%05d.png`);

        await new Promise((resolve, reject) => {
            const cmd = ffmpeg()
                .input(pattern)
                .inputOptions(['-framerate', String(fps)])
                .input(fitted.path)
                .outputOptions([
                    '-c:v', 'libx264',
                    '-pix_fmt', 'yuv420p',
                    '-r', String(fps),
                    '-crf', '20',
                    '-preset', 'medium',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-t', String(duration),
                    '-y'
                ]);

            if (captions && captions.trim()) {
                cmd.outputOptions(['-vf', captions]);
            }

            let stderrLog = '';
            cmd
                .output(segmentPath)
                .on('stderr', line => { stderrLog += line + '\n'; })
                .on('progress', p => { if (p.percent) process.stdout.write(`\r  Scene ${idx + 1}: ${p.percent.toFixed(1)}%`); })
                .on('end',  () => { console.log(`\n  ✅ Scene ${idx + 1} done`); resolve(); })
                .on('error', err => {
                    console.error(`\n  ❌ Scene ${idx + 1}:`, err.message);
                    console.error('FFmpeg stderr:\n', stderrLog);
                    reject(err);
                })
                .run();
        });

        return { segmentPath, fittedAudioPath: fitted.path };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MERGE — 3-pass: video xfade → audio adelay+amix → mux
    //
    // KEY FIX: _mergeAudioOnly receives the raw fitted MP3 files (audioPaths),
    // NOT the MP4 segment files. Demuxing audio from MP4 containers inside a
    // complex filter graph was silently failing, producing a video with no audio.
    // ═══════════════════════════════════════════════════════════════════════════
    async mergeSegmentsWithTransitions(segPaths, audioPaths, scenes, outputName, td = 0.6) {
        const out       = path.join(this.outputDir, outputName);
        const durations = scenes.map(s => s.end - s.start);

        if (segPaths.length === 1) {
            fs.copyFileSync(segPaths[0], out);
            return out;
        }

        console.log('\n📹 Pass 1/3 — Video xfade...');
        const videoTemp = path.join(this.tempDir, 'merged_video.mp4');
        await this._mergeVideoOnly(segPaths, durations, videoTemp, td);

        console.log('\n🔊 Pass 2/3 — Audio adelay + amix...');
        const audioTemp = path.join(this.tempDir, 'merged_audio.aac');
        await this._mergeAudioOnly(audioPaths, durations, audioTemp, td);

        console.log('\n🎬 Pass 3/3 — Muxing video + audio...');
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(videoTemp)
                .input(audioTemp)
                .outputOptions([
                    '-c:v', 'copy',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-movflags', '+faststart',
                    '-shortest'
                ])
                .output(out)
                .on('progress', p => { if (p.percent) process.stdout.write(`\r  Muxing: ${p.percent.toFixed(1)}%`); })
                .on('end',  () => { console.log(`\n✅ Final video: ${out}`); resolve(out); })
                .on('error', err => {
                    console.error('\nMux failed — fallback simple concat:', err.message);
                    this.mergeSegmentsSimple(segPaths, out).then(resolve).catch(reject);
                })
                .run();
        });
    }

    // Pass 1 — video only, xfade transitions, NO audio streams
    async _mergeVideoOnly(segPaths, durations, outputPath, td) {
        const vf = [];
        let offset = 0;
        for (let i = 0; i < segPaths.length - 1; i++) {
            const a = i === 0 ? '[0:v]' : `[v${i - 1}]`;
            const b = `[${i + 1}:v]`;
            const o = i === segPaths.length - 2 ? '[vout]' : `[v${i}]`;
            offset += durations[i] - td;
            vf.push(`${a}${b}xfade=transition=fade:duration=${td}:offset=${offset.toFixed(2)}${o}`);
        }

        return new Promise((resolve, reject) => {
            const cmd = ffmpeg();
            segPaths.forEach(s => cmd.input(s));
            cmd
                .complexFilter(vf)
                .outputOptions([
                    '-map', '[vout]',
                    '-an',              // ← strip all audio — video stream only
                    '-c:v', 'libx264',
                    '-pix_fmt', 'yuv420p',
                    '-crf', '20',
                    '-preset', 'medium',
                    '-y'
                ])
                .output(outputPath)
                .on('progress', p => { if (p.percent) process.stdout.write(`\r  Video pass: ${p.percent.toFixed(1)}%`); })
                .on('end',  () => { console.log('\n  ✅ Video pass done'); resolve(); })
                .on('error', reject)
                .run();
        });
    }

    // Pass 2 — audio only using RAW FITTED MP3 FILES (never MP4 containers).
    // Each audio file is offset with adelay to match the xfade-compressed
    // video timeline, then all tracks are blended with amix.
    async _mergeAudioOnly(audioPaths, durations, outputPath, td) {
        const filters   = [];
        let audioOffset = 0;

        for (let i = 0; i < audioPaths.length; i++) {
            const delayMs = Math.round(audioOffset * 1000);
            // all=1 applies the same delay to every channel (mono & stereo safe)
            filters.push(`[${i}:a]adelay=delays=${delayMs}:all=1[a${i}]`);
            if (i < audioPaths.length - 1) {
                // Advance offset by (duration - td) to match xfade video compression
                audioOffset += durations[i] - td;
            }
        }

        // normalize=0       → keep original volume (don't halve when mixing)
        // dropout_transition=0 → silence a stream immediately when it ends
        filters.push(
            `${audioPaths.map((_, i) => `[a${i}]`).join('')}` +
            `amix=inputs=${audioPaths.length}:normalize=0:dropout_transition=0[aout]`
        );

        return new Promise((resolve, reject) => {
            const cmd = ffmpeg();
            // Input the raw MP3 audio files — NOT the MP4 segments
            audioPaths.forEach(p => cmd.input(p));
            cmd
                .complexFilter(filters)
                .outputOptions([
                    '-map', '[aout]',
                    '-vn',              // ← strip all video — audio stream only
                    '-acodec', 'aac',
                    '-b:a', '192k',
                    '-y'
                ])
                .output(outputPath)
                .on('progress', p => { if (p.percent) process.stdout.write(`\r  Audio pass: ${p.percent.toFixed(1)}%`); })
                .on('end',  () => { console.log('\n  ✅ Audio pass done'); resolve(); })
                .on('error', reject)
                .run();
        });
    }

    // Simple concat fallback (no transitions)
    async mergeSegmentsSimple(segPaths, out) {
        const concat = path.join(this.tempDir, 'concat.txt');
        fs.writeFileSync(concat, segPaths.map(s => `file '${path.resolve(s).replace(/\\/g, '/')}'`).join('\n'));
        return new Promise((resolve, reject) => {
            ffmpeg()
                .input(concat).inputOptions(['-f', 'concat', '-safe', '0'])
                .outputOptions(['-c:v', 'libx264', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'])
                .output(out)
                .on('end', () => resolve(out)).on('error', reject).run();
        });
    }

    // ── MAIN ENTRY ────────────────────────────────────────────────────────────
    async generateVideoFromScenes(options = {}) {
        const {
            scenes = [], style = 'anime', fps = 8, aspectRatio = '9:16',
            captionStyle = 'bold', transition = true, transitionDuration = 0.6,
            outputName = `video_${Date.now()}.mp4`
        } = options;

        if (!scenes.length) throw new Error('Scenes array required');
        scenes.sort((a, b) => a.start - b.start);

        const dimensions    = this.aspectRatios[aspectRatio];
        const stylePrompt   = this.stylePresets[style] || style;
        const totalDuration = Math.max(...scenes.map(s => s.end));

        console.log('\n' + '═'.repeat(60));
        console.log('🎥  AI VIDEO GENERATOR v9.0 — FREE (No API keys)');
        console.log('═'.repeat(60));
        IMAGE_PROVIDERS.forEach((p, i) => console.log(`  🖼️  ${i + 1}. ${p.name}`));
        console.log('─'.repeat(60));
        TTS_PROVIDERS.forEach((p, i) => console.log(`  🎙️  ${i + 1}. ${p.name}`));
        console.log('═'.repeat(60));

        this.cleanupTemporaryFiles();

        // Collect segment video paths AND fitted audio paths separately
        const segmentPaths = [];
        const audioPaths   = [];

        for (let i = 0; i < scenes.length; i++) {
            const { segmentPath, fittedAudioPath } = await this.createSceneSegment(
                scenes[i], i, fps, stylePrompt, dimensions, captionStyle, aspectRatio
            );
            segmentPaths.push(segmentPath);
            audioPaths.push(fittedAudioPath);
            if (i < scenes.length - 1) await delay(500);
        }

        let finalPath;
        if (transition) {
            finalPath = await this.mergeSegmentsWithTransitions(
                segmentPaths, audioPaths, scenes, outputName, transitionDuration
            );
        } else {
            finalPath = await this.mergeSegmentsSimple(
                segmentPaths, path.join(this.outputDir, outputName)
            );
        }

        return {
            success: true,
            videoPath: finalPath,
            fileName: outputName,
            totalDuration,
            sceneCount: scenes.length,
            fps,
            aspectRatio,
            dimensions,
            captionType: 'voice-synced'
        };
    }

    cleanupTemporaryFiles() {
        [this.framesDir, this.tempDir].forEach(dir => {
            if (fs.existsSync(dir))
                fs.readdirSync(dir).forEach(f => { try { fs.unlinkSync(path.join(dir, f)); } catch { } });
        });
    }
}

// ═══════════════════════════════════════════════════════════════
// EXPRESS + EXPORT
// ═══════════════════════════════════════════════════════════════
const generator = new AIVideoGenerator();

export async function generateVideoFromScenesHandler(generatedScript) {
    try {
        if (!Array.isArray(generatedScript) || !generatedScript.length)
            return { error: 'Scenes array required' };
        const result = await generator.generateVideoFromScenes({
            scenes: generatedScript,
            style: 'anime',
            fps: 8,
            aspectRatio: '9:16',
            captionStyle: 'bold',
            transition: true,
            transitionDuration: 0.6,
            outputName: `video_${Date.now()}.mp4`
        });
        return { success: true, data: result, videoUrl: `/videos/${result.fileName}` };
    } catch (error) {
        return { error: 'Video generation failed', details: error.message };
    }
}

app.get('/', (req, res) => res.json({
    message: 'AI Video Generator v9.0 — Zero-Token Edition',
    imageProviders: IMAGE_PROVIDERS.map((p, i) => `${i + 1}. ${p.name}`),
    ttsProviders:   TTS_PROVIDERS.map((p, i)   => `${i + 1}. ${p.name}`),
    audioFix: '3-pass merge using raw MP3 files — no MP4 demux, no silence bug'
}));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🚀  AI Video Generator v9.0 — Zero tokens required`);
    console.log(`${'═'.repeat(60)}`);
    IMAGE_PROVIDERS.forEach((p, i) => console.log(`  🖼️  ${i + 1}. ${p.name}`));
    console.log(`─`.repeat(60));
    TTS_PROVIDERS.forEach((p, i) => console.log(`  🎙️  ${i + 1}. ${p.name}`));
    console.log(`${'═'.repeat(60)}\n`);
});