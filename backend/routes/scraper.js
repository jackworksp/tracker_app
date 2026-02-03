const express = require('express');
const router = express.Router();
const { getInstagramReelData } = require('../utils/instagramScraper');

// Scrape URL endpoint
router.post('/', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }
        
        // Basic validation for Instagram URL
        if (!url.includes('instagram.com/reel/') && !url.includes('instagram.com/p/')) {
             return res.status(400).json({ error: 'Invalid Instagram URL' });
        }

        console.log(`🕷️ Scraping request for: ${url}`);
        const data = await getInstagramReelData(url);
        
        if (data.error) {
            return res.status(500).json({ error: data.error });
        }
        
        res.json(data);
    } catch (err) {
        console.error('Scraping endpoint error:', err);
        res.status(500).json({ error: 'Failed to scrape URL' });
    }
});

module.exports = router;
