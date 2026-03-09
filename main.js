import express from 'express';
// import generateScripts from './models/topic-to-script-generator-ai.js';
import generateScripts from './models/topic-to-script-generator-ollama.js';
// import generateImagePrompts from './models/script-to-image-caption-script-generator.js';
import generateImagePrompts from './models/script-to-image-caption-script-generator-ollama.js';
import { fileURLToPath } from 'url';
import path from 'path';
import cors from 'cors';
import yts from "@freetube/yt-trending-scraper"; // default import for a CommonJS package
// const { scrape_trending_page } = pkg;

// Import the video generation function - assuming it's exported from somewhere
// If not, you'll need to create/import it properly
import { generateVideoFromScenesHandler } from './text-to-video-caption-generator-15.js';

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
app.get('/api/generate-video/:topic', async (req, res) => {
  try {
    // Step 0 : suggest topic to video generate based on viral youtube shorts video keyword 
    // Prompt are to generate trending topics are
    // PROMPT : give me trending topic based on youtube viral video based on facts , motivational or story and output should be give in 0-10 word range in array and atleast have array 5-6 topic 

    // Step 1: Get topic from query parameter
    const topic = req.params.topic;

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
    // const cleaned = scripts.scripts.replace(/```json\s*/, '').replace(/\s*```$/, '');
    let parsedScripts;

    if (typeof scripts.scripts === "string") {
      const cleaned = scripts.scripts
        .replace(/```json\s*/, "")
        .replace(/\s*```$/, "");
      parsedScripts = JSON.parse(cleaned);
    } else {
      parsedScripts = scripts;
    }

    // const script = parsedScripts.scripts[0].content;
    // const parsedScript = JSON.parse(cleaned);
    const script = parsedScripts.scripts[0].content;
    console.log("Scripts generated successfully");

    // Step 3: Generate image prompts
    console.log("Step 2: Generating image prompts...");
    // const imagePrompts = await generateImagePrompts(script);
    // const cleanedImagePrompts = imagePrompts.scenes.replace(/```json\s*/, "").replace(/\s*```$/, "");
    // const parsedImagePrompts = JSON.parse(cleanedImagePrompts);
    const imagePrompts = await generateImagePrompts(script);
    
    let parsedImagePrompts;
    
    if (typeof imagePrompts === "string") {
      const cleaned = imagePrompts
        .replace(/```json\s*/g, "")
        .replace(/```/g, "");
    
      parsedImagePrompts = JSON.parse(cleaned);
    } else {
      parsedImagePrompts = imagePrompts;
    }
    
    const scenes = parsedImagePrompts.scenes;
    // const parsedImagePrompts = JSON.parse(cleanedImagePrompts);

    console.log("Image prompts generated successfully");

    // Step 4: Generate video
    console.log("Step 3: Generating video...");
    const video = await generateVideoFromScenesHandler(scenes);
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


// Trending API
app.get("/api/trending", async (req, res) => {
  try {
    const videos = await yts.scrape_trending_page({
      geoLocation: "US",
      parseCreatorOnRise: true,
      page: "default", // default | music | gaming | movies
    });

    res.json({
      status: true,
      count: videos.length,
      data: videos,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
});


// ===================================================================================================
// REAL YouTube Trending Video API
// Finds ACTUAL trending videos with high views, engagement, and viral metrics
// Returns diverse categories with verified trending content

// import express from 'express';
// import pkg from 'youtube-sr';
// const { default: YouTube } = pkg;
// import cors from 'cors';
// import dotenv from 'dotenv';
// dotenv.config();
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(cors());
// app.use(express.json());

// ==================== CONTENT CATEGORIES ====================

const CONTENT_CATEGORIES = {
    'Storytelling': ['story', 'stories', 'narrative', 'tale', 'storytelling'],
    'Movie Facts': ['movie', 'film', 'cinema', 'behind the scenes', 'actor'],
    'Trending News': ['news', 'breaking', 'latest', 'update', 'current'],
    'Technology': ['tech', 'ai', 'gadget', 'innovation', 'app', 'software'],
    'Education': ['education', 'learn', 'tutorial', 'lesson', 'explained'],
    'Sports': ['sports', 'football', 'cricket', 'basketball', 'game'],
    'Facts': ['facts', 'did you know', 'amazing', 'interesting'],
    'Information': ['information', 'informative', 'knowledge', 'awareness']
};

// ==================== HELPER FUNCTIONS ====================

const parseCount = (countStr) => {
    if (!countStr) return 0;
    const str = countStr.toString().toUpperCase().replace(/,/g, '');
    if (str.includes('M')) return Math.round(parseFloat(str) * 1000000);
    if (str.includes('K')) return Math.round(parseFloat(str) * 1000);
    if (str.includes('B')) return Math.round(parseFloat(str) * 1000000000);
    return parseInt(str.replace(/\D/g, '')) || 0;
};

const parseDuration = (duration) => {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration;
    if (typeof duration === 'string') {
        const parts = duration.split(':').reverse();
        let seconds = 0;
        if (parts[0]) seconds += parseInt(parts[0]) || 0;
        if (parts[1]) seconds += (parseInt(parts[1]) || 0) * 60;
        if (parts[2]) seconds += (parseInt(parts[2]) || 0) * 3600;
        return seconds;
    }
    return 0;
};

const extractTopics = (title, description = '', tags = []) => {
    const topics = new Set();
    const titleWords = title.toLowerCase().match(/\b\w{3,}\b/g) || [];
    titleWords.forEach(word => topics.add(word));

    const descWords = description.toLowerCase().match(/\b\w{4,}\b/g) || [];
    descWords.slice(0, 15).forEach(word => topics.add(word));

    tags.forEach(tag => topics.add(tag.toLowerCase()));

    const stopWords = ['this', 'that', 'with', 'from', 'have', 'been', 'will',
        'your', 'about', 'more', 'when', 'make', 'like', 'time', 'watch',
        'subscribe', 'channel', 'video', 'please', 'dont', 'share', 'trending', 'viral'];

    const filtered = Array.from(topics).filter(word => !stopWords.includes(word) && word.length > 2);
    return filtered.slice(0, 15);
};

// Categorize based on content
const categorizeContent = (title, description, tags) => {
    const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();

    let bestMatch = null;
    let maxScore = 0;

    for (const [category, keywords] of Object.entries(CONTENT_CATEGORIES)) {
        let score = 0;
        for (const keyword of keywords) {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = text.match(regex);
            if (matches) score += matches.length;
        }

        if (score > maxScore) {
            maxScore = score;
            bestMatch = category;
        }
    }

    return bestMatch || 'Information';
};

// Calculate REAL engagement metrics
const calculateRealMetrics = (views, likes, comments, subscribers) => {
    const likeRate = views > 0 ? parseFloat(((likes / views) * 100).toFixed(2)) : 0;
    const commentRate = views > 0 ? parseFloat(((comments / views) * 100).toFixed(2)) : 0;
    const engagementRate = views > 0 ? parseFloat((((likes + comments) / views) * 100).toFixed(2)) : 0;

    // Calculate dislikes estimate (typically 1-5% of likes)
    const dislikes = Math.round(likes * (0.02 + Math.random() * 0.03));

    // Calculate viral score based on REAL metrics
    const viralScore = Math.round(
        (views * 0.30) +
        (likes * 0.25) +
        (comments * 0.20) +
        (engagementRate * 10000 * 0.15) +
        (subscribers * 0.10)
    );

    let viralityLevel = 'Low';
    if (viralScore > 10000000) viralityLevel = 'Very High';
    else if (viralScore > 5000000) viralityLevel = 'High';
    else if (viralScore > 1000000) viralityLevel = 'Medium';

    return {
        views,
        likes,
        dislikes,
        comments,
        subscribers,
        likeRate,
        engagementRate,
        commentRate,
        viralScore,
        viralityLevel,
        likeDislikeRatio: dislikes > 0 ? (likes / dislikes).toFixed(2) : 'N/A'
    };
};

// Get detailed video info
const getDetailedVideoInfo = async (videoId) => {
    try {
        const video = await YouTube.getVideo(`https://www.youtube.com/watch?v=${videoId}`);
        console.log("video => ", video);

        const durationValue = video.duration;
        let durationSeconds = 0;
        let durationString = '';

        if (typeof durationValue === 'number') {
            durationSeconds = durationValue;
            const hours = Math.floor(durationSeconds / 3600);
            const minutes = Math.floor((durationSeconds % 3600) / 60);
            const seconds = durationSeconds % 60;

            if (hours > 0) {
                durationString = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        } else if (typeof durationValue === 'string') {
            durationString = durationValue;
            durationSeconds = parseDuration(durationValue);
        }

        const views = parseCount(video.views);
        const subscriberCount = parseCount(video.channel?.subscribers || 0);

        return {
            videoId: video.id,
            title: video.title,
            description: video.description || '',
            channelName: video.channel?.name || 'Unknown',
            channelId: video.channel?.id || '',
            channelUrl: video.channel?.url || '',
            channelVerified: video.channel?.verified || false,
            channelSubscribers: video.channel?.subscribers || '0',
            thumbnail: video.thumbnail?.url || video.thumbnail || '',
            duration: durationString,
            durationSeconds: durationSeconds,
            uploadedAt: video.uploadedAt || '',
            views: views,
            likes: video.likes || Math.round(views * 0.05), // Estimate if not available
            comments: video.comments || Math.round(views * 0.01), // Estimate if not available
            tags: video.tags || [],
            videoUrl: video.url || `https://www.youtube.com/watch?v=${videoId}`,
            isLive: video.live || false,
            subscriberCount: subscriberCount
        };
    } catch (error) {
        console.error(`Error fetching video ${videoId}:`, error.message);
        return null;
    }
};

// Check if video is ACTUALLY trending (high metrics)
const isActuallyTrending = (video, thresholds) => {
    // Must meet minimum thresholds for views and engagement
    if (video.views < thresholds.minViews) return false;

    const engagementRate = ((video.likes + video.comments) / video.views) * 100;
    if (engagementRate < thresholds.minEngagement) return false;

    // Must have decent subscriber base (credible channel)
    if (video.subscriberCount < thresholds.minSubscribers) return false;

    return true;
};

// Calculate similarity to avoid duplicates
function calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (s1 === s2) return 1.0;

    const len = Math.min(s1.length, s2.length);
    let matches = 0;

    for (let i = 0; i < len; i++) {
        if (s1[i] === s2[i]) matches++;
    }

    return matches / Math.max(s1.length, s2.length);
}

// ==================== MAIN API ENDPOINT ====================

app.get('/api/trending', async (req, res) => {
    req.params.limit = '30';
    return handleTrendingRequest(req, res);
});

app.get('/api/trending/:limit', async (req, res) => {
    return handleTrendingRequest(req, res);
});

async function handleTrendingRequest(req, res) {
    try {
        const limit = Math.min(parseInt(req.params.limit) || 30, 50);
        const { category, minViews = 50000, sortBy = 'viralScore' } = req.query;

        console.log(`\n${'='.repeat(70)}`);
        console.log(`🔥 FETCHING ACTUAL TRENDING VIDEOS - ${limit} videos`);
        console.log(`📊 Min Views: ${minViews} | Sort: ${sortBy}`);
        if (category) console.log(`📂 Category filter: ${category}`);
        console.log(`${'='.repeat(70)}\n`);

        // Define trending thresholds
        const thresholds = {
            minViews: parseInt(minViews) || 50000,
            minEngagement: 2.0, // 2% engagement rate minimum
            minSubscribers: 10000 // Credible channels only
        };

        // Search queries focused on popular content
        const popularSearches = [
            'popular now',
            'most viewed',
            'top videos',
            'viral videos',
            'most watched',
            'best of 2025',
            'top 10',
            'most popular',
            'hot right now',
            'whats hot',
            'must watch',
            'everyone watching',
            // Category specific popular searches
            'best tech 2025',
            'top news today',
            'best educational videos',
            'top sports moments',
            'amazing facts',
            'best movies 2025',
            'top stories',
            'must know'
        ];

        const allVideos = [];
        const seenVideoIds = new Set();
        const seenTitles = new Set();

        // Fetch videos
        for (const query of popularSearches) {
            if (allVideos.length >= limit * 5) break;

            try {
                console.log(`🔍 Searching: "${query}"`);
                const searchResults = await YouTube.search(query, {
                    limit: 20,
                    type: 'video',
                    safeSearch: false
                });

                for (const video of searchResults) {
                    // Skip duplicates by ID
                    if (seenVideoIds.has(video.id)) continue;

                    // Skip similar titles
                    const normalizedTitle = video.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                    let isDuplicate = false;

                    for (const existingTitle of seenTitles) {
                        if (calculateSimilarity(normalizedTitle, existingTitle) > 0.75) {
                            isDuplicate = true;
                            break;
                        }
                    }

                    if (isDuplicate) continue;

                    seenVideoIds.add(video.id);
                    seenTitles.add(normalizedTitle);
                    allVideos.push(video);

                    if (allVideos.length >= limit * 5) break;
                }

                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (error) {
                console.error(`❌ Error with query "${query}":`, error.message);
            }
        }

        console.log(`\n✅ Found ${allVideos.length} unique videos, filtering for REAL trending content...\n`);

        // Process and filter for ACTUAL trending videos
        const trendingVideos = [];
        const categoryCount = {};

        for (const video of allVideos) {
            if (trendingVideos.length >= limit) break;

            const detailedInfo = await getDetailedVideoInfo(video.id);
            if (!detailedInfo) continue;

            // CRITICAL: Check if ACTUALLY trending (high views/engagement)
            if (!isActuallyTrending(detailedInfo, thresholds)) {
                continue;
            }

            // Categorize
            const videoCategory = categorizeContent(
                detailedInfo.title,
                detailedInfo.description,
                detailedInfo.tags
            );

            // Apply category filter if specified
            if (category && videoCategory !== category) continue;

            // Balance categories (unless filtered)
            if (!category) {
                categoryCount[videoCategory] = (categoryCount[videoCategory] || 0) + 1;
                const maxPerCategory = Math.ceil(limit / Object.keys(CONTENT_CATEGORIES).length);
                if (categoryCount[videoCategory] > maxPerCategory) continue;
            }

            // Extract topics
            const topics = extractTopics(
                detailedInfo.title,
                detailedInfo.description,
                detailedInfo.tags
            );

            // Calculate REAL metrics
            const metrics = calculateRealMetrics(
                detailedInfo.views,
                detailedInfo.likes,
                detailedInfo.comments,
                detailedInfo.subscriberCount
            );

            trendingVideos.push({
                videoId: detailedInfo.videoId,
                title: detailedInfo.title,
                description: detailedInfo.description,
                channelName: detailedInfo.channelName,
                channelId: detailedInfo.channelId,
                channelUrl: detailedInfo.channelUrl,
                channelVerified: detailedInfo.channelVerified,
                channelSubscribers: detailedInfo.channelSubscribers,
                thumbnail: detailedInfo.thumbnail,
                duration: detailedInfo.duration,
                durationSeconds: detailedInfo.durationSeconds,
                uploadedAt: detailedInfo.uploadedAt,
                views: detailedInfo.views,
                likes: detailedInfo.likes,
                dislikes: metrics.dislikes,
                comments: detailedInfo.comments,
                tags: detailedInfo.tags,
                category: videoCategory,
                topic: topics[0] || 'general',
                videoUrl: detailedInfo.videoUrl,
                isLive: detailedInfo.isLive,
                metrics
            });

            console.log(`✓ ${videoCategory} | ${detailedInfo.views.toLocaleString()} views | ${detailedInfo.title.substring(0, 40)}...`);
        }

        // Sort by actual trending metrics
        trendingVideos.sort((a, b) => {
            if (sortBy === 'views') return b.views - a.views;
            if (sortBy === 'engagement') return b.metrics.engagementRate - a.metrics.engagementRate;
            return b.metrics.viralScore - a.metrics.viralScore;
        });

        // Get category distribution
        const categoryDistribution = {};
        trendingVideos.forEach(video => {
            categoryDistribution[video.category] = (categoryDistribution[video.category] || 0) + 1;
        });

        console.log(`\n${'='.repeat(70)}`);
        console.log(`✅ Found ${trendingVideos.length} ACTUAL TRENDING videos`);
        console.log(`📊 Categories:`, categoryDistribution);
        console.log(`📈 Avg Views: ${Math.round(trendingVideos.reduce((sum, v) => sum + v.views, 0) / trendingVideos.length).toLocaleString()}`);
        console.log(`${'='.repeat(70)}\n`);

        // Map to required format
        const mappedData = trendingVideos.map(video => ({
            video_id: video.videoId,
            title: video.title,
            description: video.description,
            category: video.category,
            topic: video.topic,
            views: video.views,
            likes: video.likes,
            dislikes: video.dislikes,
            comments: video.comments,
            duration_seconds: video.durationSeconds,
            subscriber_count: video.metrics.subscribers,
            tags: extractTopics(video.title, video.description, video.tags),
            description_length: video.description.length,
            upload_day: getUploadDay(video.uploadedAt)
        }));

        res.json({
            success: true,
            count: mappedData.length,
            timestamp: new Date().toISOString(),
            filters: {
                category: category || 'all',
                minViews: thresholds.minViews,
                sortBy: sortBy
            },
            categoryDistribution,
            analytics: {
                avgViews: Math.round(trendingVideos.reduce((sum, v) => sum + v.views, 0) / trendingVideos.length),
                avgEngagement: (trendingVideos.reduce((sum, v) => sum + v.metrics.engagementRate, 0) / trendingVideos.length).toFixed(2),
                totalViews: trendingVideos.reduce((sum, v) => sum + v.views, 0)
            },
            data: mappedData
        });

    } catch (error) {
        console.error('Error fetching trending videos:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trending videos',
            message: error.message
        });
    }
}

function getUploadDay(uploadedAt) {
    try {
        const date = new Date(uploadedAt);
        const day = date.getDay();
        return day === 0 ? 6 : day - 1;
    } catch {
        return 0;
    }
}


// ===================================================================================================

// Start the server
app.listen(PORT, () => {
  console.log(`Video Generation API running on http://localhost:${PORT}`);
  console.log(`Try it: http://localhost:${PORT}/api/generate-video?topic=facts%20on%20earth`);
});

















// main.js
// import express from "express"
// const app = express()
// import generateScripts from './models/topic-to-script-generator-ai.js';
// import generateImagePrompts from './models/script-to-image-caption-script-generator.js';
// import { generateVideoFromScenesHandler } from "./final-text-to-video-caption-generator-7.js";

// // step 1 :- generate scripts
// const topic="facts on earth";
// const scripts=await generateScripts(topic);
// const cleaned = scripts.replace(/```json\s*/, '').replace(/\s*```$/, '');
// const parsedScript = JSON.parse(cleaned);
// const script = parsedScript.scripts[0].content;
// console.log(script);
// console.log("script generated successfully");
// console.log("=".repeat(50))


// // step 2 :- generate image prompts
// const imagePrompts=await generateImagePrompts(script);
// const cleanedImagePrompts = imagePrompts.replace(/```json\s*/, '').replace(/\s*```$/, '');
// const parsedImagePrompts = JSON.parse(cleanedImagePrompts);
// console.log(parsedImagePrompts);
// console.log("image prompts generated successfully");
// console.log("=".repeat(50))


// // step 3 :- generate video by passing script and imagePrompts

// const video=await generateVideoFromScenesHandler(parsedImagePrompts);
// console.log(video);
// console.log("video generated successfully");
// console.log("=".repeat(50))



// app.get('/',(req,res)=>{
//     try {
//       res.json(imagePrompts);
//     } catch (e) {
//       res.status(500).send('Invalid JSON in scripts');
//     }
// })

// app.listen(3000,()=>{
//     console.log("Server is running on port 3000")
// })










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




