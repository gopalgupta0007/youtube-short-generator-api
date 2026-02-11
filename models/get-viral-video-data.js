const YouTube = require('youtube-sr').default;

async function getTrendingVideos() {
    try {
        // Get trending videos
        const videos = await YouTube.trending();

        const jsonData = JSON.stringify(videos.slice(0, 50), null, 2);
        console.log(jsonData);

        // Save to file
        const fs = require('fs');
        fs.writeFileSync('trending_videos.json', jsonData);

    } catch (error) {
        console.error('Error:', error);
    }
}

getTrendingVideos();