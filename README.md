# Business Scout

A Node.js application for scraping Google Business information, including website contact details and social media links.

## Features

- Google Maps business extraction
- Automated contact discovery (email, social media)
- Brand logo identification and download
- CSV data export
- Local web dashboard

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browser:
   ```bash
   npx playwright install chromium
   ```

3. Start server:
   ```bash
   npm run dev
   ```

## Usage

Access the dashboard at `http://localhost:3000`. Enter a search term and location to begin the scraping process.
