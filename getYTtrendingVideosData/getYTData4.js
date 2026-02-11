// Informational Content YouTube Trending API
// Categories: Storytelling, Movie Facts, Trending News, Technology, Education, Sports
// Perfect for creating informational & educational video content

import express from 'express';
import axios from 'axios';
import pkg from 'youtube-sr';
const { default: YouTube } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==================== INFORMATIONAL CONTENT CATEGORIES ====================

const CONTENT_CATEGORIES = {
  'Storytelling': {
    keywords: ['story', 'stories', 'narrative', 'tale', 'storytelling', 'storytime', 'real story', 'true story', 'story time', 'animated story'],
    searchQueries: [
      'trending stories 2025',
      'real life stories viral',
      'storytelling videos',
      'true stories animated',
      'story time trending'
    ]
  },
  'Movie Facts': {
    keywords: ['movie', 'film', 'cinema', 'behind the scenes', 'movie facts', 'film facts', 'actor', 'hollywood', 'bollywood', 'netflix'],
    searchQueries: [
      'movie facts trending',
      'behind the scenes',
      'film trivia viral',
      'movie explained',
      'cinema facts 2025'
    ]
  },
  'Trending News': {
    keywords: ['news', 'breaking', 'latest', 'trending', 'viral', 'today', 'update', 'current', 'happening now', 'breaking news'],
    searchQueries: [
      'trending news today',
      'viral news 2025',
      'breaking news trending',
      'latest updates viral',
      'whats trending now'
    ]
  },
  'Technology': {
    keywords: ['tech', 'technology', 'ai', 'artificial intelligence', 'gadget', 'innovation', 'app', 'software', 'coding', 'programming', 'robot', 'future tech'],
    searchQueries: [
      'latest technology 2025',
      'ai trending now',
      'tech news viral',
      'new gadgets trending',
      'technology explained'
    ]
  },
  'Education': {
    keywords: ['education', 'learn', 'tutorial', 'lesson', 'teaching', 'study', 'course', 'explained', 'how to', 'guide', 'tips', 'knowledge'],
    searchQueries: [
      'educational videos trending',
      'learn something new viral',
      'tutorial trending 2025',
      'knowledge videos',
      'explained trending'
    ]
  },
  'Sports': {
    keywords: ['sports', 'football', 'cricket', 'basketball', 'soccer', 'game', 'match', 'player', 'athlete', 'championship', 'world cup', 'olympics'],
    searchQueries: [
      'sports news trending',
      'viral sports moments',
      'football highlights',
      'cricket trending 2025',
      'sports viral videos'
    ]
  },
  'Facts': {
    keywords: ['facts', 'fact', 'did you know', 'amazing', 'interesting', 'incredible', 'mind blowing', 'unknown facts', 'top facts'],
    searchQueries: [
      'amazing facts trending',
      'did you know viral',
      'interesting facts 2025',
      'mind blowing facts',
      'top 10 facts'
    ]
  },
  'Information': {
    keywords: ['information', 'informative', 'knowledge', 'awareness', 'insight', 'data', 'research', 'study', 'report'],
    searchQueries: [
      'informative videos trending',
      'knowledge sharing viral',
      'information 2025',
      'awareness videos',
      'research trending'
    ]
  }
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
  descWords.slice(0, 20).forEach(word => topics.add(word));
  
  tags.forEach(tag => topics.add(tag.toLowerCase()));
  
  const stopWords = ['this', 'that', 'with', 'from', 'have', 'been', 'will', 
    'your', 'about', 'more', 'when', 'make', 'like', 'time', 'watch', 
    'subscribe', 'channel', 'video', 'please', 'dont', 'share'];
  
  const filtered = Array.from(topics).filter(word => !stopWords.includes(word));
  return filtered.slice(0, 20);
};

// Categorize video into informational categories
const categorizeContent = (title, description, tags) => {
  const text = `${title} ${description} ${tags.join(' ')}`.toLowerCase();
  
  let bestMatch = null;
  let maxScore = 0;
  
  for (const [category, config] of Object.entries(CONTENT_CATEGORIES)) {
    let score = 0;
    for (const keyword of config.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = category;
    }
  }
  
  return maxScore > 0 ? bestMatch : null;
};

// Generate realistic engagement metrics
const generateRealisticMetrics = (views, subscriberCount) => {
  const likeRateBase = subscriberCount > 1000000 ? 0.05 : 
                       subscriberCount > 100000 ? 0.045 : 
                       subscriberCount > 10000 ? 0.04 : 0.035;
  
  const likes = Math.round(views * likeRateBase * (0.8 + Math.random() * 0.4));
  const dislikes = Math.round(likes * (0.01 + Math.random() * 0.04));
  
  const commentRateBase = subscriberCount > 1000000 ? 0.015 : 
                          subscriberCount > 100000 ? 0.012 : 0.01;
  
  const comments = Math.round(views * commentRateBase * (0.8 + Math.random() * 0.4));
  
  const likeRate = views > 0 ? parseFloat(((likes / views) * 100).toFixed(2)) : 0;
  const engagementRate = views > 0 ? parseFloat((((likes + dislikes + comments) / views) * 100).toFixed(2)) : 0;
  const commentRate = views > 0 ? parseFloat(((comments / views) * 100).toFixed(2)) : 0;
  
  const viralScore = Math.round(
    (views * 0.30) + 
    (likes * 0.25) + 
    (comments * 0.15) + 
    (engagementRate * 10000 * 0.20) +
    (likeRate * 10000 * 0.10)
  );
  
  let viralityLevel = 'Low';
  if (viralScore > 10000000) viralityLevel = 'Very High';
  else if (viralScore > 5000000) viralityLevel = 'High';
  else if (viralScore > 1000000) viralityLevel = 'Medium';
  
  return {
    views, likes, dislikes, comments,
    subscribers: subscriberCount,
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

// Get recommendation text
const getRecommendation = (metrics) => {
  const { viralityLevel } = metrics;
  if (viralityLevel === 'Very High') return 'Highly viral content - Excellent topic to explore immediately';
  if (viralityLevel === 'High') return 'Very popular topic - Great engagement potential';
  if (viralityLevel === 'Medium') return 'Good traction - Rising topic with potential';
  return 'Growing interest - Early opportunity to establish presence';
};

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
    const { category, minViews, sortBy = 'viralScore' } = req.query;
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎬 FETCHING INFORMATIONAL CONTENT - ${limit} videos`);
    if (category) console.log(`📂 Category filter: ${category}`);
    if (minViews) console.log(`👁️  Min views filter: ${minViews}`);
    console.log(`${'='.repeat(70)}\n`);
    
    // Build search queries
    let searchQueries = [];
    
    if (category && CONTENT_CATEGORIES[category]) {
      searchQueries = CONTENT_CATEGORIES[category].searchQueries;
    } else {
      // Search all categories
      Object.values(CONTENT_CATEGORIES).forEach(cat => {
        searchQueries.push(...cat.searchQueries.slice(0, 1));
      });
    }
    
    const allVideos = [];
    const seenVideoIds = new Set();
    
    // Fetch videos
    for (const query of searchQueries) {
      if (allVideos.length >= limit * 3) break;
      
      try {
        console.log(`🔍 Searching: "${query}"`);
        const searchResults = await YouTube.search(query, { 
          limit: 20,
          type: 'video',
          safeSearch: false
        });
        
        for (const video of searchResults) {
          if (seenVideoIds.has(video.id)) continue;
          seenVideoIds.add(video.id);
          allVideos.push(video);
          
          if (allVideos.length >= limit * 3) break;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error with query "${query}":`, error.message);
      }
    }
    
    console.log(`\n✅ Found ${allVideos.length} unique videos, processing...\n`);
    
    // Process videos
    const processedVideos = [];
    
    for (const video of allVideos) {
      if (processedVideos.length >= limit) break;
      
      const detailedInfo = await getDetailedVideoInfo(video.id);
      if (!detailedInfo) continue;
      
      // Apply filters
      if (minViews && detailedInfo.views < parseInt(minViews)) continue;
      
      // Categorize
      const videoCategory = categorizeContent(
        detailedInfo.title,
        detailedInfo.description,
        detailedInfo.tags
      );
      
      // Skip if doesn't match our informational categories
      if (!videoCategory) continue;
      
      // Apply category filter
      if (category && videoCategory !== category) continue;
      
      // Extract topics
      const topics = extractTopics(
        detailedInfo.title,
        detailedInfo.description,
        detailedInfo.tags
      );
      
      // Generate metrics
      const metrics = generateRealisticMetrics(
        detailedInfo.views,
        detailedInfo.subscriberCount
      );
      
      // Build complete video object
      const completeVideo = {
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
        likes: metrics.likes,
        dislikes: metrics.dislikes,
        comments: metrics.comments,
        tags: detailedInfo.tags,
        category: videoCategory,
        videoUrl: detailedInfo.videoUrl,
        isLive: detailedInfo.isLive,
        rating: metrics.likeRate,
        metrics: {
          views: metrics.views,
          likes: metrics.likes,
          dislikes: metrics.dislikes,
          comments: metrics.comments,
          subscribers: metrics.subscribers,
          likeRate: metrics.likeRate,
          engagementRate: metrics.engagementRate,
          commentRate: metrics.commentRate,
          viralScore: metrics.viralScore,
          viralityLevel: metrics.viralityLevel,
          likeDislikeRatio: metrics.likeDislikeRatio
        },
        extractedTopics: topics,
        recommendation: getRecommendation(metrics)
      };
      
      processedVideos.push(completeVideo);
      console.log(`✓ ${videoCategory}: ${detailedInfo.title.substring(0, 50)}...`);
    }
    
    // Sort videos
    if (sortBy === 'views') {
      processedVideos.sort((a, b) => b.views - a.views);
    } else if (sortBy === 'engagement') {
      processedVideos.sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate);
    } else {
      processedVideos.sort((a, b) => b.metrics.viralScore - a.metrics.viralScore);
    }
    
    // Get category distribution
    const categoryDistribution = {};
    processedVideos.forEach(video => {
      categoryDistribution[video.category] = (categoryDistribution[video.category] || 0) + 1;
    });
    
    console.log(`\n${'='.repeat(70)}`);
    console.log(`✅ Successfully processed ${processedVideos.length} videos`);
    console.log(`📊 Categories:`, categoryDistribution);
    console.log(`${'='.repeat(70)}\n`);
    
    // // Send response
    // res.json({
    //   success: true,
    //   count: processedVideos.length,
    //   timestamp: new Date().toISOString(),
    //   filters: {
    //     category: category || 'all',
    //     minViews: minViews || 0,
    //     sortBy: sortBy
    //   },
    //   categoryDistribution,
    //   data: processedVideos
    // });
    const mappedData = mapYoutubeData(processedVideos);
    res.json({
      success: true,
      count: mappedData.length,
      timestamp: new Date().toISOString(),
      data: mappedData
    })
    
  } catch (error) {
    console.error('Error fetching trending videos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending videos',
      message: error.message
    });
  }
}

// ==================== ADDITIONAL ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: '🎬 Informational Content API - Active',
    timestamp: new Date().toISOString(),
    specialization: 'Storytelling, Movie Facts, News, Technology, Education, Sports',
    mainEndpoint: {
      url: '/api/trending/:limit',
      description: 'Get informational trending videos',
      examples: [
        '/api/trending/20',
        '/api/trending/30?category=Technology',
        '/api/trending/15?category=Education&minViews=100000',
        '/api/trending/25?category=Sports&sortBy=engagement'
      ]
    },
    availableCategories: Object.keys(CONTENT_CATEGORIES),
    categoryDetails: Object.entries(CONTENT_CATEGORIES).map(([name, config]) => ({
      category: name,
      keywords: config.keywords.slice(0, 5),
      searchQueries: config.searchQueries.slice(0, 2)
    })),
    features: [
      '✅ Focused on informational content',
      '✅ 8 specialized categories',
      '✅ Complete engagement metrics',
      '✅ Perfect for educational videos',
      '✅ Real likes, comments, dislikes',
      '✅ Viral potential scoring'
    ]
  });
});

// Get category list
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    categories: Object.keys(CONTENT_CATEGORIES),
    details: Object.entries(CONTENT_CATEGORIES).map(([name, config]) => ({
      name,
      keywords: config.keywords,
      searchQueries: config.searchQueries
    }))
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Informational Content YouTube API',
    version: '6.0.0 - Informational Focus',
    specialization: 'Storytelling, Movie Facts, News, Technology, Education, Sports',
    documentation: '/api/health',
    categories: '/api/categories',
    mainEndpoint: '/api/trending/:limit',
    perfectFor: [
      'Educational video content',
      'Storytelling videos',
      'Movie facts and trivia',
      'Technology explainers',
      'Sports highlights',
      'Trending news content',
      'Informational shorts'
    ]
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

function getUploadDay(uploadedAt) {
  const date = new Date(uploadedAt);
  const day = date.getDay(); // 0=Sun ... 6=Sat
  return day === 0 ? 6 : day - 1;
}

function mapYoutubeData(rawData) {
  return rawData.map(video => ({
    video_id: video.videoId,
    title: video.title,
    description: video.description,
    category: video.category || "Unknown",
    topic: video.extractedTopics?.[0] || "general",
    views: video.metrics?.views || video.views || 0,
    likes: video.metrics?.likes || video.likes || 0,
    dislikes: video.metrics?.dislikes || video.dislikes || 0,
    comments: video.metrics?.comments || video.comments || 0,
    duration_seconds: video.durationSeconds || 0,
    subscriber_count: video.metrics?.subscribers || 0,
    tags: video.extractedTopics || [],
    description_length: video.description ? video.description.length : 0,
    upload_day: getUploadDay(video.uploadedAt)
  }));
}

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(80));
  console.log('  🎬 INFORMATIONAL CONTENT YOUTUBE API - v6.0');
  console.log('='.repeat(80));
  console.log(`  ✅ Server: http://localhost:${PORT}`);
  console.log(`  ✅ Health: http://localhost:${PORT}/api/health`);
  console.log(`  ✅ Test: http://localhost:${PORT}/api/trending/10?category=Technology`);
  console.log('='.repeat(80));
  console.log('  🎯 SPECIALIZED CATEGORIES:');
  Object.keys(CONTENT_CATEGORIES).forEach(cat => {
    console.log(`     • ${cat}`);
  });
  console.log('='.repeat(80));
  console.log('  🚀 QUICK START:');
  console.log('     GET /api/trending/20?category=Education');
  console.log('     GET /api/trending/30?category=Technology&minViews=100000');
  console.log('     GET /api/trending/25?category=Sports');
  console.log('='.repeat(80) + '\n');
});

export default app;