// YouTube Trending Video API - Working Solution
// Option 1: Using scrape-youtube (Most Reliable)
// Install: npm install express scrape-youtube cors dotenv

import express from 'express';
import { youtube } from 'scrape-youtube';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to extract topics from video
const extractTopics = (title, description = '') => {
  const topics = [];
  const text = `${title} ${description}`.toLowerCase();
  
  // Extract meaningful words (longer than 3 characters)
  const words = text.match(/\b\w{4,}\b/g) || [];
  const uniqueWords = [...new Set(words)];
  
  // Filter out common words
  const stopWords = ['this', 'that', 'with', 'from', 'have', 'been', 'will', 'your', 'about', 'more', 'when', 'make', 'like', 'time'];
  const filtered = uniqueWords.filter(word => !stopWords.includes(word));
  
  return filtered.slice(0, 10); // Return top 10 topics
};

// Helper function to calculate engagement rate
const calculateEngagement = (video) => {
  const views = parseInt(video.views) || 0;
  const likes = parseInt(video.likes) || 0;
  
  if (views === 0) return 0;
  return ((likes / views) * 100).toFixed(2);
};

// Helper function to calculate viral score
const calculateViralScore = (video) => {
  const views = parseInt(video.views) || 0;
  const likes = parseInt(video.likes) || 0;
  
  const engagementRate = views > 0 ? (likes / views) : 0;
  const viralScore = (views * 0.6) + (likes * 0.3) + (engagementRate * 1000000 * 0.1);
  
  return Math.round(viralScore);
};

// Route 1: Search trending videos by keyword
app.get('/api/search', async (req, res) => {
  try {
    const { 
      query = 'trending', 
      limit = 50 
    } = req.query;

    console.log(`Searching for: ${query}`);

    const searchResults = await youtube.search(query, { 
      type: 'video',
      limit: parseInt(limit)
    });

    // Enhance video data
    const enhancedVideos = searchResults.videos.map(video => ({
      videoId: video.id,
      title: video.title,
      channelName: video.channel.name,
      channelId: video.channel.id,
      channelUrl: video.channel.url,
      views: video.views,
      uploadedAt: video.uploaded,
      duration: video.duration,
      thumbnail: video.thumbnail,
      description: video.description,
      // Additional computed fields
      engagementRate: calculateEngagement(video),
      extractedTopics: extractTopics(video.title, video.description),
      videoUrl: video.url,
      searchQuery: query
    }));

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

// Route 2: Get trending videos (searches for "trending" keyword)
app.get('/api/trending', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    console.log(`Fetching trending videos`);

    // Search for multiple trending-related terms
    const trendingTerms = ['trending now', 'viral videos', 'popular videos'];
    const allVideos = [];

    for (const term of trendingTerms) {
      try {
        const searchResults = await youtube.search(term, { 
          type: 'video',
          limit: 20
        });
        allVideos.push(...searchResults.videos);
      } catch (err) {
        console.log(`Failed to search for ${term}:`, err.message);
      }
    }

    // Remove duplicates based on video ID
    const uniqueVideos = Array.from(
      new Map(allVideos.map(video => [video.id, video])).values()
    );

    // Sort by views and limit
    const sortedVideos = uniqueVideos
      .sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0))
      .slice(0, parseInt(limit));

    // Enhance video data
    const enhancedVideos = sortedVideos.map(video => ({
      videoId: video.id,
      title: video.title,
      channelName: video.channel.name,
      channelId: video.channel.id,
      channelUrl: video.channel.url,
      views: video.views,
      uploadedAt: video.uploaded,
      duration: video.duration,
      thumbnail: video.thumbnail,
      description: video.description,
      engagementRate: calculateEngagement(video),
      extractedTopics: extractTopics(video.title, video.description),
      videoUrl: video.url,
      viralScore: calculateViralScore(video)
    }));

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

// Route 3: Get trending by category
app.get('/api/trending/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 30 } = req.query;

    const categoryQueries = {
      music: ['trending music', 'popular songs', 'music video'],
      gaming: ['trending gaming', 'popular games', 'gaming highlights'],
      tech: ['trending tech', 'technology news', 'tech review'],
      entertainment: ['trending entertainment', 'viral videos', 'funny videos'],
      education: ['trending tutorials', 'how to', 'educational videos'],
      sports: ['trending sports', 'sports highlights', 'sports news'],
      news: ['trending news', 'breaking news', 'news today']
    };

    const queries = categoryQueries[category.toLowerCase()] || [category];
    const allVideos = [];

    console.log(`Fetching trending videos for category: ${category}`);

    for (const query of queries) {
      try {
        const searchResults = await youtube.search(query, { 
          type: 'video',
          limit: 15
        });
        allVideos.push(...searchResults.videos);
      } catch (err) {
        console.log(`Failed to search for ${query}:`, err.message);
      }
    }

    // Remove duplicates and sort
    const uniqueVideos = Array.from(
      new Map(allVideos.map(video => [video.id, video])).values()
    );

    const sortedVideos = uniqueVideos
      .sort((a, b) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0))
      .slice(0, parseInt(limit));

    const enhancedVideos = sortedVideos.map(video => ({
      videoId: video.id,
      title: video.title,
      channelName: video.channel.name,
      views: video.views,
      uploadedAt: video.uploaded,
      thumbnail: video.thumbnail,
      extractedTopics: extractTopics(video.title, video.description),
      videoUrl: video.url,
      category: category
    }));

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

// Route 4: Get trending topics
app.get('/api/trending-topics', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    console.log(`Fetching trending topics`);

    const searchResults = await youtube.search('trending now', { 
      type: 'video',
      limit: 50
    });

    // Extract and count all topics
    const topicCount = {};
    const topicVideos = {};

    searchResults.videos.forEach(video => {
      const topics = extractTopics(video.title, video.description);
      topics.forEach(topic => {
        topicCount[topic] = (topicCount[topic] || 0) + 1;
        if (!topicVideos[topic]) {
          topicVideos[topic] = [];
        }
        topicVideos[topic].push({
          videoId: video.id,
          title: video.title,
          views: video.views,
          url: video.url
        });
      });
    });

    // Sort topics by frequency
    const sortedTopics = Object.entries(topicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, parseInt(limit))
      .map(([topic, count]) => ({
        topic,
        frequency: count,
        percentage: ((count / searchResults.videos.length) * 100).toFixed(2),
        sampleVideos: topicVideos[topic].slice(0, 3)
      }));

    res.json({
      success: true,
      totalVideos: searchResults.videos.length,
      totalUniqueTopics: Object.keys(topicCount).length,
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

// Route 5: Get recommendations based on viral metrics
app.get('/api/recommendations', async (req, res) => {
  try {
    const { topic = 'trending', minViews = 10000, limit = 10 } = req.query;

    console.log(`Fetching recommendations for topic: ${topic}`);

    const searchResults = await youtube.search(topic, { 
      type: 'video',
      limit: 50
    });

    // Filter and rank videos by viral metrics
    const recommendations = searchResults.videos
      .filter(video => parseInt(video.views) >= parseInt(minViews))
      .map(video => ({
        videoId: video.id,
        title: video.title,
        channelName: video.channel.name,
        views: video.views,
        uploadedAt: video.uploaded,
        thumbnail: video.thumbnail,
        extractedTopics: extractTopics(video.title, video.description),
        viralScore: calculateViralScore(video),
        videoUrl: video.url,
        recommendation: getRecommendationText(video)
      }))
      .sort((a, b) => b.viralScore - a.viralScore)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      topic: topic,
      count: recommendations.length,
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

// Helper function to generate recommendation text
const getRecommendationText = (video) => {
  const views = parseInt(video.views) || 0;
  
  if (views > 1000000) {
    return 'Highly viral content - Excellent topic to explore';
  } else if (views > 500000) {
    return 'Very popular - Great engagement potential';
  } else if (views > 100000) {
    return 'Good traction - Rising topic';
  } else {
    return 'Growing interest - Early opportunity';
  }
};

// Route 6: Get channel trending videos
app.get('/api/channel/:channelId', async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 20 } = req.query;

    console.log(`Fetching videos from channel: ${channelId}`);

    const searchResults = await youtube.search(`channel:${channelId}`, { 
      type: 'video',
      limit: parseInt(limit)
    });

    const videos = searchResults.videos.map(video => ({
      videoId: video.id,
      title: video.title,
      views: video.views,
      uploadedAt: video.uploaded,
      thumbnail: video.thumbnail,
      extractedTopics: extractTopics(video.title),
      videoUrl: video.url
    }));

    res.json({
      success: true,
      channelId: channelId,
      count: videos.length,
      timestamp: new Date().toISOString(),
      videos
    });

  } catch (error) {
    console.error('Error fetching channel videos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch channel videos',
      message: error.message
    });
  }
});

// Route 7: Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      search: '/api/search?query=trending&limit=50',
      trending: '/api/trending?limit=50',
      trendingCategory: '/api/trending/:category?limit=30',
      trendingTopics: '/api/trending-topics?limit=20',
      recommendations: '/api/recommendations?topic=trending&minViews=10000&limit=10',
      channelVideos: '/api/channel/:channelId?limit=20'
    },
    availableCategories: ['music', 'gaming', 'tech', 'entertainment', 'education', 'sports', 'news']
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'YouTube Trending Video API - Working Solution',
    version: '2.0.0',
    documentation: '/api/health',
    note: 'This API uses scrape-youtube package for reliable data extraction',
    github: 'https://github.com/FreeTubeApp/yt-trending-scraper'
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
  console.log('YouTube Trending Video API - v2.0');
  console.log('========================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Test trending: http://localhost:${PORT}/api/trending`);
  console.log('========================================');
});

export default app;










































































































// // YouTube Trending Video API using Express
// // Install: npm install express @freetube/yt-trending-scraper cors dotenv

// import express from 'express';
// import yts from '@freetube/yt-trending-scraper';
// import cors from 'cors';
// import dotenv from 'dotenv';

// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Helper function to extract topics from video
// const extractTopics = (video) => {
//   const topics = [];
  
//   // Extract from title
//   if (video.title) {
//     const titleWords = video.title.toLowerCase().split(' ');
//     topics.push(...titleWords.filter(word => word.length > 3));
//   }
  
//   return [...new Set(topics)]; // Remove duplicates
// };

// // Helper function to calculate engagement rate
// const calculateEngagement = (video) => {
//   const views = parseInt(video.viewCount) || 0;
//   const likes = parseInt(video.likeCount) || 0;
  
//   if (views === 0) return 0;
//   return ((likes / views) * 100).toFixed(2);
// };

// // Route 1: Get trending videos by region and category
// app.get('/api/trending', async (req, res) => {
//   try {
//     const { 
//       region = 'US', 
//       category = 'default',
//       parseCreator = 'true' 
//     } = req.query;

//     // Validate category
//     const validCategories = ['default', 'music', 'gaming', 'movies'];
//     const selectedCategory = validCategories.includes(category) ? category : 'default';

//     console.log(`Fetching trending videos for ${region} - ${selectedCategory}`);

//     const videos = await yts.scrapeTrendingPage({
//       geoLocation: region.toUpperCase(),
//       parseCreatorOnRise: parseCreator === 'true',
//       page: selectedCategory
//     });

//     // Enhance video data with additional metrics
//     const enhancedVideos = videos.map(video => ({
//       videoId: video.videoId,
//       title: video.title,
//       channelName: video.channelName,
//       channelId: video.channelId,
//       viewCount: video.viewCount,
//       likeCount: video.likeCount,
//       uploadDate: video.uploadDate,
//       duration: video.duration,
//       thumbnails: video.thumbnails,
//       description: video.description,
//       // Additional computed fields
//       engagementRate: calculateEngagement(video),
//       extractedTopics: extractTopics(video),
//       videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
//       category: selectedCategory,
//       region: region.toUpperCase()
//     }));

//     res.json({
//       success: true,
//       count: enhancedVideos.length,
//       region: region.toUpperCase(),
//       category: selectedCategory,
//       timestamp: new Date().toISOString(),
//       data: enhancedVideos
//     });

//   } catch (error) {
//     console.error('Error fetching trending videos:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch trending videos',
//       message: error.message
//     });
//   }
// });

// // Route 2: Get trending videos for multiple categories
// app.get('/api/trending/all-categories', async (req, res) => {
//   try {
//     const { region = 'US' } = req.query;
//     const categories = ['default', 'music', 'gaming', 'movies'];

//     console.log(`Fetching all categories for ${region}`);

//     const allResults = await Promise.all(
//       categories.map(async (category) => {
//         try {
//           const videos = await yts.scrapeTrendingPage({
//             geoLocation: region.toUpperCase(),
//             parseCreatorOnRise: true,
//             page: category
//           });

//           return {
//             category,
//             count: videos.length,
//             videos: videos.slice(0, 10).map(video => ({
//               videoId: video.videoId,
//               title: video.title,
//               channelName: video.channelName,
//               viewCount: video.viewCount,
//               likeCount: video.likeCount,
//               extractedTopics: extractTopics(video),
//               videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`
//             }))
//           };
//         } catch (err) {
//           return {
//             category,
//             count: 0,
//             videos: [],
//             error: err.message
//           };
//         }
//       })
//     );

//     res.json({
//       success: true,
//       region: region.toUpperCase(),
//       timestamp: new Date().toISOString(),
//       categories: allResults
//     });

//   } catch (error) {
//     console.error('Error fetching all categories:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch trending videos for all categories',
//       message: error.message
//     });
//   }
// });

// // Route 3: Get top trending topics
// app.get('/api/trending/topics', async (req, res) => {
//   try {
//     const { region = 'US', category = 'default', limit = 20 } = req.query;

//     console.log(`Fetching trending topics for ${region} - ${category}`);

//     const videos = await yts.scrapeTrendingPage({
//       geoLocation: region.toUpperCase(),
//       parseCreatorOnRise: true,
//       page: category
//     });

//     // Extract and count all topics
//     const topicCount = {};
//     const topicVideos = {};

//     videos.forEach(video => {
//       const topics = extractTopics(video);
//       topics.forEach(topic => {
//         topicCount[topic] = (topicCount[topic] || 0) + 1;
//         if (!topicVideos[topic]) {
//           topicVideos[topic] = [];
//         }
//         topicVideos[topic].push({
//           videoId: video.videoId,
//           title: video.title,
//           viewCount: video.viewCount
//         });
//       });
//     });

//     // Sort topics by frequency
//     const sortedTopics = Object.entries(topicCount)
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, parseInt(limit))
//       .map(([topic, count]) => ({
//         topic,
//         frequency: count,
//         percentage: ((count / videos.length) * 100).toFixed(2),
//         sampleVideos: topicVideos[topic].slice(0, 3)
//       }));

//     res.json({
//       success: true,
//       region: region.toUpperCase(),
//       category,
//       totalVideos: videos.length,
//       totalUniqueTopics: Object.keys(topicCount).length,
//       timestamp: new Date().toISOString(),
//       trendingTopics: sortedTopics
//     });

//   } catch (error) {
//     console.error('Error fetching trending topics:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch trending topics',
//       message: error.message
//     });
//   }
// });

// // Route 4: Get video recommendations based on viral metrics
// app.get('/api/recommendations', async (req, res) => {
//   try {
//     const { region = 'US', minViews = 100000, limit = 10 } = req.query;

//     console.log(`Fetching recommendations for ${region}`);

//     const videos = await yts.scrapeTrendingPage({
//       geoLocation: region.toUpperCase(),
//       parseCreatorOnRise: true,
//       page: 'default'
//     });

//     // Filter and rank videos by viral metrics
//     const recommendations = videos
//       .filter(video => parseInt(video.viewCount) >= parseInt(minViews))
//       .map(video => ({
//         videoId: video.videoId,
//         title: video.title,
//         channelName: video.channelName,
//         viewCount: video.viewCount,
//         likeCount: video.likeCount,
//         engagementRate: calculateEngagement(video),
//         extractedTopics: extractTopics(video),
//         viralScore: calculateViralScore(video),
//         videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
//         recommendation: getRecommendationText(video)
//       }))
//       .sort((a, b) => b.viralScore - a.viralScore)
//       .slice(0, parseInt(limit));

//     res.json({
//       success: true,
//       region: region.toUpperCase(),
//       count: recommendations.length,
//       timestamp: new Date().toISOString(),
//       recommendations
//     });

//   } catch (error) {
//     console.error('Error fetching recommendations:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch recommendations',
//       message: error.message
//     });
//   }
// });

// // Helper function to calculate viral score
// const calculateViralScore = (video) => {
//   const views = parseInt(video.viewCount) || 0;
//   const likes = parseInt(video.likeCount) || 0;
  
//   // Simple viral score calculation
//   const engagementRate = views > 0 ? (likes / views) : 0;
//   const viralScore = (views * 0.6) + (likes * 0.3) + (engagementRate * 1000000 * 0.1);
  
//   return Math.round(viralScore);
// };

// // Helper function to generate recommendation text
// const getRecommendationText = (video) => {
//   const engagement = parseFloat(calculateEngagement(video));
  
//   if (engagement > 5) {
//     return 'Highly engaging content - Great topic to explore';
//   } else if (engagement > 2) {
//     return 'Good engagement - Popular topic';
//   } else {
//     return 'Trending topic - High view count';
//   }
// };

// // Route 5: Get statistics summary
// app.get('/api/stats', async (req, res) => {
//   try {
//     const { region = 'US', category = 'default' } = req.query;

//     console.log(`Fetching statistics for ${region} - ${category}`);

//     const videos = await yts.scrapeTrendingPage({
//       geoLocation: region.toUpperCase(),
//       parseCreatorOnRise: true,
//       page: category
//     });

//     // Calculate statistics
//     const totalViews = videos.reduce((sum, v) => sum + (parseInt(v.viewCount) || 0), 0);
//     const totalLikes = videos.reduce((sum, v) => sum + (parseInt(v.likeCount) || 0), 0);
//     const avgViews = Math.round(totalViews / videos.length);
//     const avgLikes = Math.round(totalLikes / videos.length);

//     // Get top channels
//     const channelCounts = {};
//     videos.forEach(video => {
//       channelCounts[video.channelName] = (channelCounts[video.channelName] || 0) + 1;
//     });

//     const topChannels = Object.entries(channelCounts)
//       .sort((a, b) => b[1] - a[1])
//       .slice(0, 10)
//       .map(([channel, count]) => ({ channel, trendingVideos: count }));

//     res.json({
//       success: true,
//       region: region.toUpperCase(),
//       category,
//       timestamp: new Date().toISOString(),
//       statistics: {
//         totalVideos: videos.length,
//         totalViews,
//         totalLikes,
//         avgViews,
//         avgLikes,
//         avgEngagementRate: ((totalLikes / totalViews) * 100).toFixed(2) + '%'
//       },
//       topChannels
//     });

//   } catch (error) {
//     console.error('Error fetching statistics:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch statistics',
//       message: error.message
//     });
//   }
// });

// // Route 6: Health check
// app.get('/api/health', (req, res) => {
//   res.json({
//     success: true,
//     status: 'API is running',
//     timestamp: new Date().toISOString(),
//     endpoints: {
//       trending: '/api/trending?region=US&category=default',
//       allCategories: '/api/trending/all-categories?region=US',
//       topics: '/api/trending/topics?region=US&category=default&limit=20',
//       recommendations: '/api/recommendations?region=US&minViews=100000&limit=10',
//       stats: '/api/stats?region=US&category=default'
//     }
//   });
// });

// // Root route
// app.get('/', (req, res) => {
//   res.json({
//     message: 'YouTube Trending Video API',
//     version: '1.0.0',
//     documentation: '/api/health',
//     availableRegions: ['US', 'GB', 'CA', 'IN', 'AU', 'DE', 'FR', 'JP', 'KR', 'MX'],
//     availableCategories: ['default', 'music', 'gaming', 'movies']
//   });
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({
//     success: false,
//     error: 'Internal server error',
//     message: err.message
//   });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log('========================================');
//   console.log('YouTube Trending Video API Server');
//   console.log('========================================');
//   console.log(`Server running on http://localhost:${PORT}`);
//   console.log(`Health check: http://localhost:${PORT}/api/health`);
//   console.log('========================================');
// });

// export default app;












// {
//   "success": true,
//   "count": 50,
//   "region": "US",
//   "category": "default",
//   "data": [
//     {
//       "videoId": "abc123",
//       "title": "Amazing Video",
//       "channelName": "Channel Name",
//       "viewCount": "1000000",
//       "likeCount": "50000",
//       "engagementRate": "5.00",
//       "extractedTopics": ["amazing", "video", "tutorial"],
//       "videoUrl": "https://www.youtube.com/watch?v=abc123"
//     }
//   ]
// }
// ```

// ### **2. Get All Categories**
// ```
// GET /api/trending/all-categories?region=US
// ```

// ### **3. Get Trending Topics**
// ```
// GET /api/trending/topics?region=US&category=default&limit=20
// ```

// ### **4. Get Recommendations**
// ```
// GET /api/recommendations?region=US&minViews=100000&limit=10
// ```

// ### **5. Get Statistics**
// ```
// GET /api/stats?region=US&category=default
// ```

// ### **6. Health Check**
// ```
// GET /api/health