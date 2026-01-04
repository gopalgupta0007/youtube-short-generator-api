
// YouTube Trending Video API - Complete Detailed Data
// Install: npm install express youtube-sr axios cheerio cors dotenv
// Alternative: npm install play-dl (has better data)

import express from 'express';
import axios from 'axios';
import pkg from 'youtube-sr';
const { default: YouTube } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';

// YouTube Trending Video API - Complete Detailed Data
// Install: npm install express youtube-sr axios cheerio cors dotenv
// Alternative: npm install play-dl (has better data)

// import express from 'express';
// import YouTube from 'youtube-sr';
// import axios from 'axios';
// import cors from 'cors';
// import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to extract topics from video
const extractTopics = (title, description = '', tags = []) => {
  const topics = new Set();
  
  // From title
  const titleWords = title.toLowerCase().match(/\b\w{4,}\b/g) || [];
  titleWords.forEach(word => topics.add(word));
  
  // From description
  const descWords = description.toLowerCase().match(/\b\w{4,}\b/g) || [];
  descWords.slice(0, 20).forEach(word => topics.add(word));
  
  // From tags
  tags.forEach(tag => topics.add(tag.toLowerCase()));
  
  // Remove common stop words
  const stopWords = ['this', 'that', 'with', 'from', 'have', 'been', 'will', 'your', 'about', 'more', 'when', 'make', 'like', 'time', 'watch', 'subscribe', 'channel', 'video'];
  const filtered = Array.from(topics).filter(word => !stopWords.includes(word));
  
  return filtered.slice(0, 15);
};

// Helper function to parse view count string
const parseViewCount = (viewStr) => {
  if (!viewStr) return 0;
  
  const str = viewStr.toString().toLowerCase();
  
  if (str.includes('k')) {
    return Math.round(parseFloat(str) * 1000);
  } else if (str.includes('m')) {
    return Math.round(parseFloat(str) * 1000000);
  } else if (str.includes('b')) {
    return Math.round(parseFloat(str) * 1000000000);
  }
  
  return parseInt(str.replace(/\D/g, '')) || 0;
};

// Helper function to parse duration
const parseDuration = (duration) => {
  if (!duration) return 0;
  
  // If duration is already a number (seconds), return it
  if (typeof duration === 'number') return duration;
  
  // If it's a string, parse it
  if (typeof duration === 'string') {
    const parts = duration.split(':').reverse();
    let seconds = 0;
    
    if (parts[0]) seconds += parseInt(parts[0]);
    if (parts[1]) seconds += parseInt(parts[1]) * 60;
    if (parts[2]) seconds += parseInt(parts[2]) * 3600;
    
    return seconds;
  }
  
  return 0;
};

// Helper function to calculate detailed engagement metrics
const calculateDetailedMetrics = (video) => {
  const views = parseViewCount(video.views);
  const likes = video.likes || 0;
  const dislikes = video.dislikes || 0;
  const comments = video.comments || 0;
  const subscribers = video.channel?.subscribers || 0;
  
  const likeRate = views > 0 ? ((likes / views) * 100).toFixed(2) : 0;
  const engagementRate = views > 0 ? (((likes + dislikes + comments) / views) * 100).toFixed(2) : 0;
  const commentRate = views > 0 ? ((comments / views) * 100).toFixed(2) : 0;
  
  // Calculate viral score
  const viralScore = (
    (views * 0.30) + 
    (likes * 0.25) + 
    (comments * 0.15) + 
    (parseFloat(engagementRate) * 10000 * 0.20) +
    (parseFloat(likeRate) * 10000 * 0.10)
  );
  
  // Determine virality level
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
    likeRate: parseFloat(likeRate),
    engagementRate: parseFloat(engagementRate),
    commentRate: parseFloat(commentRate),
    viralScore: Math.round(viralScore),
    viralityLevel,
    likeDislikeRatio: dislikes > 0 ? (likes / dislikes).toFixed(2) : 'N/A'
  };
};

// Helper function to get detailed video info
const getDetailedVideoInfo = async (videoId) => {
  try {
    const video = await YouTube.getVideo(`https://www.youtube.com/watch?v=${videoId}`);
    
    // Handle duration - it might be a number or string
    const durationValue = video.duration;
    let durationSeconds = 0;
    let durationString = '';
    
    if (typeof durationValue === 'number') {
      durationSeconds = durationValue;
      // Convert seconds to HH:MM:SS or MM:SS format
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
    
    return {
      videoId: video.id,
      title: video.title,
      description: video.description || '',
      channelName: video.channel?.name || 'Unknown',
      channelId: video.channel?.id || '',
      channelUrl: video.channel?.url || '',
      channelVerified: video.channel?.verified || false,
      channelSubscribers: video.channel?.subscribers || 0,
      thumbnail: video.thumbnail?.url || video.thumbnail || '',
      duration: durationString,
      durationSeconds: durationSeconds,
      uploadedAt: video.uploadedAt || '',
      views: parseViewCount(video.views),
      likes: video.likes || 0,
      dislikes: video.dislikes || 0,
      comments: video.comments || 0,
      tags: video.tags || [],
      category: video.category || 'Unknown',
      videoUrl: video.url || `https://www.youtube.com/watch?v=${videoId}`,
      isLive: video.live || false,
      rating: video.ratings?.likes || 0
    };
  } catch (error) {
    console.error(`Error getting details for ${videoId}:`, error.message);
    return null;
  }
};

// Route 1: Search with complete details
app.get('/api/search', async (req, res) => {
  try {
    const { 
      query = 'trending', 
      limit = 30,
      detailed = 'true'
    } = req.query;

    console.log(`Searching for: ${query}`);

    const searchResults = await YouTube.search(query, { 
      limit: parseInt(limit),
      type: 'video'
    });

    let enhancedVideos = [];

    if (detailed === 'true') {
      // Get detailed info for each video
      for (const video of searchResults) {
        const detailedInfo = await getDetailedVideoInfo(video.id);
        if (detailedInfo) {
          const metrics = calculateDetailedMetrics(detailedInfo);
          const topics = extractTopics(
            detailedInfo.title, 
            detailedInfo.description, 
            detailedInfo.tags
          );
          
          enhancedVideos.push({
            ...detailedInfo,
            metrics,
            extractedTopics: topics
          });
        }
      }
    } else {
      // Basic info only
      enhancedVideos = searchResults.map(video => ({
        videoId: video.id,
        title: video.title,
        channelName: video.channel?.name,
        views: parseViewCount(video.views),
        thumbnail: video.thumbnail?.url || video.thumbnail,
        videoUrl: video.url
      }));
    }

    res.json({
      success: true,
      count: enhancedVideos.length,
      searchQuery: query,
      timestamp: new Date().toISOString(),
      data: enhancedVideos
    });

  } catch (error) {
    console.error('Error searching videos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search videos',
      message: error.message
    });
  }
});

// Route 2: Get trending videos with complete details
app.get('/api/trending', async (req, res) => {
  try {
    const { 
      limit = 30,
      detailed = 'true'
    } = req.query;

    console.log(`Fetching trending videos`);

    // Search for trending content
    const searchResults = await YouTube.search('trending now 2024', { 
      limit: parseInt(limit),
      type: 'video',
      safeSearch: false
    });

    let enhancedVideos = [];

    if (detailed === 'true') {
      for (const video of searchResults) {
        const detailedInfo = await getDetailedVideoInfo(video.id);
        if (detailedInfo) {
          const metrics = calculateDetailedMetrics(detailedInfo);
          const topics = extractTopics(
            detailedInfo.title, 
            detailedInfo.description, 
            detailedInfo.tags
          );
          
          enhancedVideos.push({
            ...detailedInfo,
            metrics,
            extractedTopics: topics,
            recommendation: getRecommendationText(metrics)
          });
        }
      }
    }

    // Sort by viral score
    enhancedVideos.sort((a, b) => b.metrics.viralScore - a.metrics.viralScore);

    res.json({
      success: true,
      count: enhancedVideos.length,
      timestamp: new Date().toISOString(),
      data: enhancedVideos
    });

  } catch (error) {
    console.error('Error fetching trending videos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending videos',
      message: error.message
    });
  }
});

// Route 3: Get trending by category with complete details
app.get('/api/trending/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 30 } = req.query;

    const categoryQueries = {
      music: 'trending music 2024',
      gaming: 'trending gaming 2024',
      tech: 'trending technology 2024',
      entertainment: 'viral entertainment 2024',
      education: 'trending tutorials 2024',
      sports: 'trending sports 2024',
      news: 'trending news today',
      comedy: 'viral funny videos 2024',
      food: 'trending cooking 2024',
      lifestyle: 'trending lifestyle 2024'
    };

    const query = categoryQueries[category.toLowerCase()] || `trending ${category} 2024`;

    console.log(`Fetching trending videos for category: ${category}`);

    const searchResults = await YouTube.search(query, { 
      limit: parseInt(limit),
      type: 'video'
    });

    let enhancedVideos = [];

    for (const video of searchResults) {
      const detailedInfo = await getDetailedVideoInfo(video.id);
      if (detailedInfo) {
        const metrics = calculateDetailedMetrics(detailedInfo);
        const topics = extractTopics(
          detailedInfo.title, 
          detailedInfo.description, 
          detailedInfo.tags
        );
        
        enhancedVideos.push({
          ...detailedInfo,
          metrics,
          extractedTopics: topics,
          category: category,
          recommendation: getRecommendationText(metrics)
        });
      }
    }

    // Sort by viral score
    enhancedVideos.sort((a, b) => b.metrics.viralScore - a.metrics.viralScore);

    res.json({
      success: true,
      count: enhancedVideos.length,
      category: category,
      timestamp: new Date().toISOString(),
      data: enhancedVideos
    });

  } catch (error) {
    console.error('Error fetching category videos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category videos',
      message: error.message
    });
  }
});

// Route 4: Get trending topics with complete analytics
app.get('/api/trending-topics', async (req, res) => {
  try {
    const { limit = 20, category = 'all' } = req.query;

    console.log(`Fetching trending topics`);

    const query = category === 'all' ? 'trending now 2024' : `trending ${category} 2024`;
    const searchResults = await YouTube.search(query, { 
      limit: 50,
      type: 'video'
    });

    // Extract and count all topics with video details
    const topicData = {};

    for (const video of searchResults) {
      const detailedInfo = await getDetailedVideoInfo(video.id);
      if (detailedInfo) {
        const topics = extractTopics(
          detailedInfo.title, 
          detailedInfo.description, 
          detailedInfo.tags
        );
        const metrics = calculateDetailedMetrics(detailedInfo);
        
        topics.forEach(topic => {
          if (!topicData[topic]) {
            topicData[topic] = {
              frequency: 0,
              totalViews: 0,
              totalLikes: 0,
              totalComments: 0,
              videos: [],
              avgViralScore: 0
            };
          }
          
          topicData[topic].frequency += 1;
          topicData[topic].totalViews += metrics.views;
          topicData[topic].totalLikes += metrics.likes;
          topicData[topic].totalComments += metrics.comments;
          topicData[topic].avgViralScore += metrics.viralScore;
          topicData[topic].videos.push({
            videoId: detailedInfo.videoId,
            title: detailedInfo.title,
            views: metrics.views,
            viralScore: metrics.viralScore,
            url: detailedInfo.videoUrl
          });
        });
      }
    }

    // Calculate averages and sort
    const sortedTopics = Object.entries(topicData)
      .map(([topic, data]) => ({
        topic,
        frequency: data.frequency,
        avgViews: Math.round(data.totalViews / data.frequency),
        avgLikes: Math.round(data.totalLikes / data.frequency),
        avgComments: Math.round(data.totalComments / data.frequency),
        avgViralScore: Math.round(data.avgViralScore / data.frequency),
        percentage: ((data.frequency / searchResults.length) * 100).toFixed(2),
        topVideos: data.videos
          .sort((a, b) => b.viralScore - a.viralScore)
          .slice(0, 3),
        recommendation: getTopicRecommendation(data, searchResults.length)
      }))
      .sort((a, b) => b.avgViralScore - a.avgViralScore)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      category: category,
      totalVideosAnalyzed: searchResults.length,
      totalUniqueTopics: Object.keys(topicData).length,
      timestamp: new Date().toISOString(),
      trendingTopics: sortedTopics
    });

  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trending topics',
      message: error.message
    });
  }
});

// Route 5: Get video recommendations with complete data
app.get('/api/recommendations', async (req, res) => {
  try {
    const { 
      topic = 'trending', 
      minViews = 10000, 
      limit = 10,
      sortBy = 'viralScore' // viralScore, views, engagement
    } = req.query;

    console.log(`Fetching recommendations for topic: ${topic}`);

    const searchResults = await YouTube.search(topic, { 
      limit: 50,
      type: 'video'
    });

    let recommendations = [];

    for (const video of searchResults) {
      const detailedInfo = await getDetailedVideoInfo(video.id);
      if (detailedInfo && detailedInfo.views >= parseInt(minViews)) {
        const metrics = calculateDetailedMetrics(detailedInfo);
        const topics = extractTopics(
          detailedInfo.title, 
          detailedInfo.description, 
          detailedInfo.tags
        );
        
        recommendations.push({
          ...detailedInfo,
          metrics,
          extractedTopics: topics,
          recommendation: getRecommendationText(metrics),
          contentStrategy: generateContentStrategy(detailedInfo, metrics, topics)
        });
      }
    }

    // Sort recommendations
    if (sortBy === 'views') {
      recommendations.sort((a, b) => b.metrics.views - a.metrics.views);
    } else if (sortBy === 'engagement') {
      recommendations.sort((a, b) => b.metrics.engagementRate - a.metrics.engagementRate);
    } else {
      recommendations.sort((a, b) => b.metrics.viralScore - a.metrics.viralScore);
    }

    recommendations = recommendations.slice(0, parseInt(limit));

    res.json({
      success: true,
      topic: topic,
      count: recommendations.length,
      sortedBy: sortBy,
      timestamp: new Date().toISOString(),
      recommendations
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations',
      message: error.message
    });
  }
});

// Route 6: Get complete video analytics
app.get('/api/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;

    console.log(`Fetching analytics for video: ${videoId}`);

    const detailedInfo = await getDetailedVideoInfo(videoId);
    
    if (!detailedInfo) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    const metrics = calculateDetailedMetrics(detailedInfo);
    const topics = extractTopics(
      detailedInfo.title, 
      detailedInfo.description, 
      detailedInfo.tags
    );

    res.json({
      success: true,
      videoAnalytics: {
        ...detailedInfo,
        metrics,
        extractedTopics: topics,
        recommendation: getRecommendationText(metrics),
        contentStrategy: generateContentStrategy(detailedInfo, metrics, topics),
        similarTopics: topics.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Error fetching video analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch video analytics',
      message: error.message
    });
  }
});

// Helper function to generate recommendation text
const getRecommendationText = (metrics) => {
  const { viralityLevel, views, engagementRate, likeRate } = metrics;
  
  if (viralityLevel === 'Very High') {
    return 'Highly viral content - Excellent topic to explore immediately';
  } else if (viralityLevel === 'High') {
    return 'Very popular topic - Great engagement potential';
  } else if (viralityLevel === 'Medium') {
    return 'Good traction - Rising topic with potential';
  } else {
    return 'Growing interest - Early opportunity to establish presence';
  }
};

// Helper function to get topic recommendation
const getTopicRecommendation = (data, totalVideos) => {
  const frequency = data.frequency;
  const avgViews = data.totalViews / frequency;
  
  if (frequency > totalVideos * 0.3 && avgViews > 100000) {
    return 'Highly recommended - Very popular with strong performance';
  } else if (frequency > totalVideos * 0.2) {
    return 'Recommended - Consistent performer with good reach';
  } else if (avgViews > 500000) {
    return 'Hidden gem - Low competition but high potential';
  } else {
    return 'Emerging topic - Consider for early adoption';
  }
};

// Helper function to generate content strategy
const generateContentStrategy = (video, metrics, topics) => {
  return {
    recommendedTopics: topics.slice(0, 5),
    optimalDuration: `${Math.floor(video.durationSeconds / 60)}-${Math.floor(video.durationSeconds / 60) + 2} minutes`,
    targetViews: Math.round(metrics.views * 0.7),
    targetEngagement: `${metrics.engagementRate}%+`,
    keyTags: topics.slice(0, 10),
    contentType: video.durationSeconds > 600 ? 'Long-form' : 'Short-form',
    bestPractices: [
      'Use similar topic keywords in title',
      `Aim for ${metrics.engagementRate}%+ engagement rate`,
      'Include trending tags from this niche',
      'Post during peak hours (2-4 PM)',
      `Target ${Math.round(metrics.views * 0.5)}+ views in first 24 hours`
    ]
  };
};

// Route 7: Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'API is running with detailed analytics',
    timestamp: new Date().toISOString(),
    endpoints: {
      search: '/api/search?query=python&limit=30&detailed=true',
      trending: '/api/trending?limit=30&detailed=true',
      trendingCategory: '/api/trending/:category?limit=30',
      trendingTopics: '/api/trending-topics?limit=20&category=all',
      recommendations: '/api/recommendations?topic=ai&minViews=10000&limit=10&sortBy=viralScore',
      videoAnalytics: '/api/video/:videoId'
    },
    features: [
      'Complete video metadata',
      'Engagement metrics (likes, comments, views)',
      'Viral score calculation',
      'Topic extraction',
      'Content strategy recommendations',
      'Detailed analytics'
    ],
    availableCategories: ['music', 'gaming', 'tech', 'entertainment', 'education', 'sports', 'news', 'comedy', 'food', 'lifestyle']
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'YouTube Trending Video API - Complete Detailed Data',
    version: '3.0.0',
    documentation: '/api/health',
    note: 'This API provides complete video analytics including likes, comments, engagement rates, and viral scores'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('YouTube Trending API - v3.0 (Complete Data)');
  console.log('========================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Test trending: http://localhost:${PORT}/api/trending?limit=10`);
  console.log('========================================');
  console.log('📊 Features:');
  console.log('   - Complete video metadata');
  console.log('   - Likes, comments, views');
  console.log('   - Engagement & viral scores');
  console.log('   - Topic extraction & analysis');
  console.log('   - Content strategy recommendations');
  console.log('========================================');
});

export default app;

