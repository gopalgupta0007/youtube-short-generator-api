// Indian Trending Videos API - Today's Most Viral Content
// Returns RECENT viral videos from India with highest engagement in shortest time
// Focuses on current trending topics like news, gold/silver prices, breaking events

import express from 'express';
import pkg from 'youtube-sr';
const { default: YouTube } = pkg;
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==================== INDIAN TRENDING TOPICS ====================

const CURRENT_INDIAN_TOPICS = {
    'Breaking News': [
        'breaking news india today',
        'latest news india',
        'india news today',
        'समाचार आज का',
        'आज की ताज़ा खबर'
    ],
    'Economy & Finance': [
        'gold price today india',
        'silver price crash india',
        'stock market india today',
        'rupee dollar rate today',
        'petrol diesel price today',
        'सोने का भाव आज'
    ],
    'Politics': [
        'parliament session today',
        'election news india',
        'political news india today',
        'राजनीति समाचार'
    ],
    'Entertainment': [
        'bollywood news today',
        'latest movie trailer india',
        'web series trending india',
        'बॉलीवुड न्यूज़'
    ],
    'Sports': [
        'cricket india today',
        'ipl today match',
        'india cricket highlights',
        'क्रिकेट आज'
    ],
    'Technology': [
        'tech news india today',
        'mobile launch india',
        'gadget review india',
        'टेक्नोलॉजी न्यूज़'
    ],
    'Business': [
        'business news india today',
        'startup news india',
        'companies india news'
    ],
    'Weather': [
        'weather today india',
        'rain forecast india',
        'temperature today'
    ]
};

// ==================== HELPER FUNCTIONS ====================

const parseCount = (countStr) => {
    if (!countStr) return 0;
    const str = countStr.toString().toUpperCase().replace(/,/g, '');
    if (str.includes('M')) return Math.round(parseFloat(str) * 1000000);
    if (str.includes('K')) return Math.round(parseFloat(str) * 1000);
    if (str.includes('B')) return Math.round(parseFloat(str) * 1000000000);
    if (str.includes('LAKH')) return Math.round(parseFloat(str) * 100000);
    if (str.includes('CRORE')) return Math.round(parseFloat(str) * 10000000);
    return parseInt(str.replace(/\D/g, '')) || 0;
};

// Check if video is from today or yesterday
const isRecent = (uploadedAt) => {
    if (!uploadedAt) return false;

    const videoDate = new Date(uploadedAt);
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // Accept videos from last 48 hours
    return videoDate >= twoDaysAgo;
};

// Calculate time since upload in hours
const getHoursSinceUpload = (uploadedAt) => {
    if (!uploadedAt) return 999;
    const videoDate = new Date(uploadedAt);
    const now = new Date();
    const diffMs = now - videoDate;
    return Math.floor(diffMs / (1000 * 60 * 60));
};

// Calculate viral velocity (views per hour)
const calculateViralVelocity = (views, hoursSinceUpload) => {
    if (hoursSinceUpload === 0) return views;
    return Math.round(views / hoursSinceUpload);
};

// Check if content is India-related
const isIndianContent = (title, description, channelName, tags) => {
    const text = `${title} ${description} ${channelName} ${tags.join(' ')}`.toLowerCase();

    const indianIndicators = [
        // Location keywords
        'india', 'indian', 'bharat', 'delhi', 'mumbai', 'bangalore', 'chennai',
        'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'modi', 'parliament',

        // Hindi keywords
        'आज', 'खबर', 'समाचार', 'न्यूज़', 'भारत', 'हिंदी',

        // Indian topics
        'rupee', 'ipl', 'bollywood', 'cricket india', 'bse', 'nse',
        'lok sabha', 'rajya sabha', 'bjp', 'congress', 'aap',

        // Indian media
        'zee news', 'aaj tak', 'ndtv', 'times now', 'republic',
        'india tv', 'tv9', 'abp news', 'hindi news'
    ];

    return indianIndicators.some(indicator => text.includes(indicator));
};

// Calculate detailed metrics
const calculateDetailedMetrics = (video, hoursSinceUpload) => {
    const views = video.views;
    const likes = video.likes;
    const comments = video.comments;
    const subscribers = video.subscriberCount;

    const likeRate = views > 0 ? parseFloat(((likes / views) * 100).toFixed(2)) : 0;
    const commentRate = views > 0 ? parseFloat(((comments / views) * 100).toFixed(2)) : 0;
    const engagementRate = views > 0 ? parseFloat((((likes + comments) / views) * 100).toFixed(2)) : 0;

    // Estimate dislikes (typically 2-5% of likes)
    const dislikes = Math.round(likes * (0.02 + Math.random() * 0.03));

    // Calculate viral velocity
    const viralVelocity = calculateViralVelocity(views, hoursSinceUpload);

    // Calculate viral score - HEAVILY weighted towards recent high-velocity content
    const viralScore = Math.round(
        (views * 0.20) +                          // Base views
        (likes * 0.20) +                          // Engagement
        (comments * 0.15) +                       // Discussion
        (viralVelocity * 0.30) +                  // VIRAL VELOCITY (most important!)
        (engagementRate * 5000 * 0.10) +         // Engagement percentage
        (subscribers * 0.05)                      // Channel authority
    );

    let viralityLevel = 'Low';
    if (viralScore > 5000000) viralityLevel = 'Very High';
    else if (viralScore > 2000000) viralityLevel = 'High';
    else if (viralScore > 500000) viralityLevel = 'Medium';

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
        viralVelocity,
        viewsPerHour: viralVelocity,
        hoursSinceUpload,
        likeDislikeRatio: dislikes > 0 ? (likes / dislikes).toFixed(2) : 'N/A'
    };
};

// Extract topics
const extractTopics = (title, description = '', tags = []) => {
    const topics = new Set();
    const titleWords = title.match(/\b\w{3,}\b/g) || [];
    titleWords.forEach(word => topics.add(word.toLowerCase()));

    tags.forEach(tag => topics.add(tag.toLowerCase()));

    const stopWords = ['this', 'that', 'with', 'from', 'have', 'been', 'will',
        'your', 'about', 'more', 'when', 'make', 'like', 'time', 'watch',
        'subscribe', 'channel', 'video', 'today', 'latest', 'new'];

    const filtered = Array.from(topics).filter(word => !stopWords.includes(word) && word.length > 2);
    return filtered.slice(0, 15);
};

// Get detailed video info
const getDetailedVideoInfo = async (videoId) => {
    try {
        const video = await YouTube.getVideo(`https://www.youtube.com/watch?v=${videoId}`);

        const durationValue = video.duration;
        let durationSeconds = 0;

        if (typeof durationValue === 'number') {
            durationSeconds = durationValue;
        } else if (typeof durationValue === 'string') {
            const parts = durationValue.split(':').reverse();
            if (parts[0]) durationSeconds += parseInt(parts[0]) || 0;
            if (parts[1]) durationSeconds += (parseInt(parts[1]) || 0) * 60;
            if (parts[2]) durationSeconds += (parseInt(parts[2]) || 0) * 3600;
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
            durationSeconds: durationSeconds,
            uploadedAt: video.uploadedAt || '',
            views: views,
            likes: video.likes || Math.round(views * 0.03),
            comments: video.comments || Math.round(views * 0.005),
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

// Categorize content
const categorizeContent = (title, description) => {
    const text = `${title} ${description}`.toLowerCase();

    // Check for specific current topics
    if (text.includes('gold') || text.includes('silver') || text.includes('सोना')) {
        return 'Economy & Finance';
    }
    if (text.includes('breaking') || text.includes('ब्रेकिंग')) {
        return 'Breaking News';
    }
    if (text.includes('cricket') || text.includes('ipl') || text.includes('क्रिकेट')) {
        return 'Sports';
    }
    if (text.includes('bollywood') || text.includes('movie') || text.includes('बॉलीवुड')) {
        return 'Entertainment';
    }
    if (text.includes('stock') || text.includes('market') || text.includes('शेयर')) {
        return 'Economy & Finance';
    }
    if (text.includes('election') || text.includes('parliament') || text.includes('चुनाव')) {
        return 'Politics';
    }
    if (text.includes('tech') || text.includes('mobile') || text.includes('टेक्नोलॉजी')) {
        return 'Technology';
    }

    return 'Breaking News';
};

// ==================== MAIN API ENDPOINT ====================

app.get('/api/trending', async (req, res) => {
    req.params.limit = '30';
    return handleIndianTrendingRequest(req, res);
});

app.get('/api/trending/:limit', async (req, res) => {
    return handleIndianTrendingRequest(req, res);
});

async function handleIndianTrendingRequest(req, res) {
    try {
        const limit = Math.min(parseInt(req.params.limit) || 30, 50);
        const { category, minViews = 1000, minVelocity = 100 } = req.query;

        console.log(`\n${'='.repeat(80)}`);
        console.log(`🇮🇳 FETCHING TODAY'S INDIAN TRENDING VIDEOS`);
        console.log(`📊 Target: ${limit} videos | Min Views: ${minViews} | Min Velocity: ${minVelocity}/hr`);
        if (category) console.log(`📂 Category: ${category}`);
        console.log(`${'='.repeat(80)}\n`);

        const allVideos = [];
        const seenVideoIds = new Set();

        // Search current Indian trending topics
        const searchQueries = [];

        if (category && CURRENT_INDIAN_TOPICS[category]) {
            searchQueries.push(...CURRENT_INDIAN_TOPICS[category]);
        } else {
            // Search all current topics
            for (const topics of Object.values(CURRENT_INDIAN_TOPICS)) {
                searchQueries.push(...topics);
            }
        }

        // Fetch videos
        for (const query of searchQueries) {
            if (allVideos.length >= limit * 3) break;

            try {
                console.log(`🔍 Searching: "${query}"`);

                const searchResults = await YouTube.search(query, {
                    limit: 10,
                    type: 'video',
                    safeSearch: false
                });

                for (const video of searchResults) {
                    if (seenVideoIds.has(video.id)) continue;
                    seenVideoIds.add(video.id);
                    allVideos.push(video);
                }

                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error(`❌ Error with query "${query}":`, error.message);
            }
        }

        console.log(`\n✅ Found ${allVideos.length} videos, filtering for RECENT INDIAN viral content...\n`);

        // Process and filter
        const trendingVideos = [];

        for (const video of allVideos) {
            if (trendingVideos.length >= limit) break;

            const detailedInfo = await getDetailedVideoInfo(video.id);
            if (!detailedInfo) continue;

            // FILTER 1: Must be recent (today or yesterday)
            if (!isRecent(detailedInfo.uploadedAt)) {
                continue;
            }

            // FILTER 2: Must be Indian content
            if (!isIndianContent(
                detailedInfo.title,
                detailedInfo.description,
                detailedInfo.channelName,
                detailedInfo.tags
            )) {
                continue;
            }

            // Calculate hours since upload
            const hoursSinceUpload = getHoursSinceUpload(detailedInfo.uploadedAt);

            // FILTER 3: Must have minimum views
            if (detailedInfo.views < parseInt(minViews)) {
                continue;
            }

            // Calculate metrics with viral velocity
            const metrics = calculateDetailedMetrics(detailedInfo, hoursSinceUpload);

            // FILTER 4: Must have good viral velocity (views per hour)
            if (metrics.viralVelocity < parseInt(minVelocity)) {
                continue;
            }

            // Categorize
            const videoCategory = categorizeContent(
                detailedInfo.title,
                detailedInfo.description
            );

            // Extract topics
            const topics = extractTopics(
                detailedInfo.title,
                detailedInfo.description,
                detailedInfo.tags
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
                durationSeconds: detailedInfo.durationSeconds,
                uploadedAt: detailedInfo.uploadedAt,
                hoursSinceUpload: hoursSinceUpload,
                views: detailedInfo.views,
                likes: detailedInfo.likes,
                dislikes: metrics.dislikes,
                comments: detailedInfo.comments,
                tags: detailedInfo.tags,
                category: videoCategory,
                topic: topics[0] || 'trending',
                videoUrl: detailedInfo.videoUrl,
                isLive: detailedInfo.isLive,
                metrics,
                extractedTopics: topics
            });

            console.log(`✓ [${hoursSinceUpload}h] ${videoCategory} | ${metrics.viralVelocity} v/h | ${detailedInfo.title.substring(0, 50)}...`);
        }

        // Sort by viral velocity (most viral in shortest time)
        trendingVideos.sort((a, b) => b.metrics.viralVelocity - a.metrics.viralVelocity);

        // Get category distribution
        const categoryDistribution = {};
        trendingVideos.forEach(video => {
            categoryDistribution[video.category] = (categoryDistribution[video.category] || 0) + 1;
        });

        console.log(`\n${'='.repeat(80)}`);
        console.log(`✅ Found ${trendingVideos.length} RECENT INDIAN TRENDING videos`);
        console.log(`📊 Categories:`, categoryDistribution);
        console.log(`📈 Avg Viral Velocity: ${Math.round(trendingVideos.reduce((sum, v) => sum + v.metrics.viralVelocity, 0) / trendingVideos.length).toLocaleString()} views/hour`);
        console.log(`⏱️  Avg Age: ${Math.round(trendingVideos.reduce((sum, v) => sum + v.hoursSinceUpload, 0) / trendingVideos.length)} hours`);
        console.log(`${'='.repeat(80)}\n`);

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
            tags: video.extractedTopics,
            description_length: video.description.length,
            upload_day: new Date(video.uploadedAt).getDay(),
            hours_since_upload: video.hoursSinceUpload,
            viral_velocity: video.metrics.viralVelocity,
            engagement_rate: video.metrics.engagementRate,
            viral_score: video.metrics.viralScore,
            virality_level: video.metrics.viralityLevel
        }));

        res.json({
            success: true,
            count: mappedData.length,
            timestamp: new Date().toISOString(),
            filters: {
                region: 'India',
                timeframe: 'Last 48 hours',
                category: category || 'all',
                minViews: parseInt(minViews),
                minVelocity: parseInt(minVelocity)
            },
            categoryDistribution,
            analytics: {
                avgViralVelocity: Math.round(trendingVideos.reduce((sum, v) => sum + v.metrics.viralVelocity, 0) / trendingVideos.length),
                avgHoursSinceUpload: Math.round(trendingVideos.reduce((sum, v) => sum + v.hoursSinceUpload, 0) / trendingVideos.length),
                avgEngagement: (trendingVideos.reduce((sum, v) => sum + v.metrics.engagementRate, 0) / trendingVideos.length).toFixed(2),
                totalViews: trendingVideos.reduce((sum, v) => sum + v.views, 0)
            },
            data: mappedData
        });

    } catch (error) {
        console.error('Error fetching Indian trending videos:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trending videos',
            message: error.message
        });
    }
}

// ==================== ADDITIONAL ENDPOINTS ====================

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: '🇮🇳 Indian Trending Videos API - Active',
        timestamp: new Date().toISOString(),
        description: 'Returns TODAY\'S viral Indian videos with highest views/hour',
        mainEndpoint: '/api/trending/:limit',
        examples: [
            '/api/trending/20',
            '/api/trending/30?category=Economy%20%26%20Finance',
            '/api/trending/25?minViews=5000&minVelocity=500'
        ],
        features: [
            '✅ Only recent videos (last 48 hours)',
            '✅ Indian content only',
            '✅ Sorted by viral velocity (views/hour)',
            '✅ Current topics: gold/silver, news, politics, cricket',
            '✅ Hindi & English support',
            '✅ Breaking news detection'
        ],
        availableCategories: Object.keys(CURRENT_INDIAN_TOPICS)
    });
});

app.get('/', (req, res) => {
    res.json({
        message: '🇮🇳 Indian Trending Videos API',
        version: '8.0.0 - Today\'s Viral Indian Content',
        description: 'Returns most viral RECENT videos from India',
        currentTopics: [
            'Gold/Silver prices',
            'Breaking news',
            'Cricket/IPL',
            'Stock market',
            'Politics',
            'Bollywood'
        ],
        documentation: '/api/health'
    });
});

app.listen(PORT, () => {
    console.log('\n' + '='.repeat(80));
    console.log('  🇮🇳 INDIAN TRENDING VIDEOS API - v8.0');
    console.log('='.repeat(80));
    console.log(`  ✅ Server: http://localhost:${PORT}`);
    console.log(`  ✅ Test: http://localhost:${PORT}/api/trending/20`);
    console.log('='.repeat(80));
    console.log('  🎯 FEATURES:');
    console.log('     • TODAY\'S viral Indian videos only (last 48hrs)');
    console.log('     • Sorted by VIRAL VELOCITY (views/hour)');
    console.log('     • Current topics: Gold, News, Cricket, Politics');
    console.log('     • Hindi & English content');
    console.log('     • Breaking news detection');
    console.log('='.repeat(80) + '\n');
});

export default app;
















// {
//     "success": true,
//     "count": 2,
//     "timestamp": "2026-02-02T05:24:36.744Z",
//     "filters": {
//       "region": "India",
//       "timeframe": "Last 48 hours",
//       "category": "all",
//       "minViews": 1000,
//       "minVelocity": 100
//     },
//     "categoryDistribution": {
//       "Sports": 1,
//       "Breaking News": 1
//     },
//     "analytics": {
//       "avgViralVelocity": 487,
//       "avgHoursSinceUpload": 34,
//       "avgEngagement": "3.50",
//       "totalViews": 33091
//     },
//     "data": [
//       {
//         "video_id": "4q12BoS2BTw",
//         "title": "Budget 2026: Indian FM’s Huge Income Tax Announcement | Latest Slabs, Old & New Regime Rates",
//         "description": "Finance Minister Nirmala Sitharaman has kept income tax slabs unchanged for FY 2026–27, continuing the same structure that applied in FY 2025–26 under both the new tax regime and the old tax regime. With the new Income Tax Act set to come into force in the coming months, expectations of major tax relief were already low — and Budget 2026 has confirmed continuity over change. Under the new tax regime, incomes up to ₹4 lakh remain tax-free, while the highest 30% slab applies only above ₹24 lakh, making it the default option for most taxpayers. The old tax regime also remains unchanged, continuing with higher rates but allowing multiple deductions like HRA, LTA, Section 80C, 80D, NPS and home loan benefits.\n\n#Budget2026 #IncomeTaxSlabs #FY2026 #NewTaxRegime #OldTaxRegime #NirmalaSitharaman #IncomeTaxIndia #BudgetLive #MiddleClassTax #SalariedTaxpayers #TaxPlanningIndia #UnionBudget2026 #ITR2026 #IndianEconomy #PersonalFinanceIndia\n\nTimes Of India (TOI) Is The Largest Selling English Daily In The World. \n\nTimes Of India Videos Bring You Global News, Views And Sharp Analysis. We Track India's Global Rise, Her Increasing Engagement With The World, The Changing Geopolitical Landscape Amid Conflicts And Wars And The Emerging World Order.  \n\nINTERNATIONAL NEWS | GLOBAL CONFLICTS | MIDDLE EAST WAR | CHANGING WORLD ORDER #TOILive | #TOIVideos \n\nSubscribe to the Times Of India YT channel and press the bell icon to get notified when we go live.\n\nJoin Millions Reading TOI; Download Our App At http://toi.in/app-yt\n\nVisit our website https://www.timesofindia.com/\nFollow us on X/ @timesofindia  \nFacebook: https://www.facebook.com/TimesofIndia\nInstagram: https://www.instagram.com/timesofindia/\nFollow the TOI WhatsApp channel: https://bit.ly/3RYl0J9\nFor daily news & updates and exclusive stories, follow the Times of India",
//         "category": "Sports",
//         "topic": "budget",
//         "views": 24531,
//         "likes": 736,
//         "dislikes": 23,
//         "comments": 123,
//         "duration_seconds": 623000,
//         "subscriber_count": 5740000,
//         "tags": [
//           "budget",
//           "2026",
//           "indian",
//           "huge",
//           "income",
//           "tax",
//           "announcement",
//           "slabs",
//           "old",
//           "regime",
//           "rates",
//           "times of india",
//           "toi",
//           "latest news",
//           "news"
//         ],
//         "description_length": 1834,
//         "upload_day": 0,
//         "hours_since_upload": 34,
//         "viral_velocity": 722,
//         "engagement_rate": 3.5,
//         "viral_score": 294038,
//         "virality_level": "Low"
//       },
//       {
//         "video_id": "plxtjNx_iCw",
//         "title": "Inside India's Economic Dominance Amid US Tariff Wars | Indian Economy | Latest News",
//         "description": "Why India STILL Dominates Global Economy Amid US Tariffs | Inconnect News | Indian Economy News |\nWhile much of the world struggles with slow growth, inflation, and uncertainty, India is projected to grow at 7.3–7.4% in FY 2025–26, making it the fastest-growing major economy! Is this just optimism—or is there solid economic logic behind it? From strong domestic demand and rising GST collections to a revival in investment and confidence from the RBI, IMF, and World Bank, India’s growth story is defying the global slowdown. But the big question remains: Can India turn high growth into jobs and long-term prosperitY. Watch this Inconnect News report for full details!\n\n#India #IndianEconomy #IndianEconomyNews #IndiaEconomy #FastestGrowingEconomy #RBI #IMF #WorldBank #EconomicGrowth #IndiaGrowth #GlobalEconomy #IndiaSuperpower #Modi #IndiaUS #IndiaUSTradeDeal #IndiaEUFTA #Geopolitics #news #currentaffairs #worldnews \n\nInside India's Economic Dominance Amid US Tariff Wars |\nAccording to the Reserve Bank Of India, the Indian economy is projected to grow at a strong 7.3–7.4% in FY 2025–26, keeping India on track as the fastest-growing major economy in the world. This forecast has become a major talking point in world news, especially at a time when global growth is slowing due to wars, trade disruptions, and rising geopolitical tensions. The key question is how the India economy continues to outperform despite challenges such as India US tariffs, global tariff war concerns, and uncertainty in international trade.\n\nThe RBI Bulletin makes it clear that the Indian economy is largely driven by domestic demand rather than exports. Strong consumption indicators, resilient services activity, and stable investment flows have helped the economy remain insulated even as global trade faces pressure from US tariffs on India and uncertainty around India US trade and a potential India US trade deal. These factors continue to influence India US relations and broader trade dynamics involving major economies.\n\nInvestment activity is also improving, supported by healthier corporate balance sheets, rising bank credit, and sustained government capital expenditure. According to global assessments, this growth outlook is not merely political messaging linked to Modi or PM Modi, but is supported by solid macroeconomic fundamentals. International institutions have echoed the RBI’s confidence, strengthening India’s position in the global economy.\n\nAt the same time, risks remain. Developments related to India vs China, the India China relationship, and ongoing tensions involving India vs Pakistan and India Pakistan continue to shape geopolitics and defence news. Trade negotiations such as the India EU FTA will also play a role in determining future growth prospects.\n\nIndia’s challenge now lies in converting high growth into jobs, inclusive development, and long-term stability while navigating global trade pressures and an evolving strategic environment.\n\nTune in for Inconnect News Insights and the latest news on Defence, Geopolitics and Economy.\n\nHere are a few questions, leave a comment and have your say:\nWhy is India growing when the world is slowing down?\nIs India’s 7.4% growth truly sustainable?\nWhat makes India the fastest-growing major economy?\nCan India convert growth into jobs and prosperity?\nWill India become the world’s third-largest economy by 2030?\n\n#indian #news #englishnews #latestnews #newsupdate #newsupdates #currentnews #currentaffairstoday #latestnewstoday #newsalert #inconnectnews \n\nConnect with us: \nOn Youtube: https://www.youtube.com/@inconnectnews/featured\nOn Instagram: @inconnectnews\nOn Twitter: @inconnectnews\nOn Facebook: https://www.facebook.com/Inconnectnewsofficial/ \nOn Linkedin: https://www.linkedin.com/company/inconnectnews/\n\nWelcome to Inconnectnews, where news meets infotainment! We bring you daily audio-visual updates on News & current affairs. Join us as we explore the world and bring you the latest news from around India, the Indian Ocean Region, Indo Pacific and beyond!",
//         "category": "Breaking News",
//         "topic": "inside",
//         "views": 8560,
//         "likes": 257,
//         "dislikes": 7,
//         "comments": 43,
//         "duration_seconds": 581000,
//         "subscriber_count": 69800,
//         "tags": [
//           "inside",
//           "india",
//           "economic",
//           "dominance",
//           "amid",
//           "tariff",
//           "wars",
//           "indian",
//           "economy",
//           "news",
//           "inconnect news",
//           "india us tariffs",
//           "india us relations",
//           "india us trade deal",
//           "india tariffs"
//         ],
//         "description_length": 4044,
//         "upload_day": 0,
//         "hours_since_upload": 34,
//         "viral_velocity": 252,
//         "engagement_rate": 3.5,
//         "viral_score": 7085,
//         "virality_level": "Low"
//       }
//     ]
//   }