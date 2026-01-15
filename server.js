const express = require('express');
const cors = require('cors');
const { scrapeGoogleMaps } = require('./scraper');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/scrape', async (req, res) => {
    const { niche, location, limit } = req.body;
    if (!niche || !location) {
        return res.status(400).json({ error: 'Niche and location are required' });
    }

    const query = `${niche} in ${location}`;
    try {
        console.log(`Starting scrape for: ${query}`);
        const data = await scrapeGoogleMaps(query, limit || 10);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Scrape error:', error);
        res.status(500).json({ error: 'Failed to scrape data', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
