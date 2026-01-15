const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

async function scrapeGoogleMaps(query, limit = 20) {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setViewportSize({ width: 1280, height: 800 });

    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl);

    try {
        await page.waitForSelector('div[role="feed"]', { timeout: 15000 });
    } catch (e) {
        console.log("Feed selector not found, attempting fallback...");
    }

    const results = [];
    let lastHeight = 0;

    while (results.length < limit) {
        const resultElements = await page.$$('a.hfpxzc');

        for (const el of resultElements) {
            if (results.length >= limit) break;

            try {
                const name = await el.getAttribute('aria-label');
                if (!name || results.some(r => r.name === name)) continue;

                await el.click();
                await page.waitForTimeout(1500);

                const details = await extractDetails(page, context);
                results.push({ name, ...details });

                console.log(`Scraped: ${name}`);
            } catch (err) {
             
            }
        }

        const feed = await page.$('div[role="feed"]');
        if (feed) {
            await feed.evaluate(node => node.scrollBy(0, 1000));
            await page.waitForTimeout(2000);
            const newHeight = await feed.evaluate(node => node.scrollHeight);
            if (newHeight === lastHeight) break;
            lastHeight = newHeight;
        } else {
            break;
        }
    }

    await browser.close();
    return results;
}

async function extractDetails(page, context) {
    const details = {
        rating: '',
        reviews: '',
        category: '',
        address: '',
        website: '',
        phone: '',
        description: '',
        hours: '',
        logo: '',
        email: '',
        socials: {
            facebook: '',
            instagram: '',
            linkedin: '',
            twitter: ''
        }
    };

    try {
        details.rating = await page.$eval('span[aria-label*="stars"]', node => node.getAttribute('aria-label').split(' ')[0]).catch(() => '');
        details.reviews = await page.$eval('button[aria-label*="reviews"]', node => node.innerText.replace(/[^0-9,]/g, '')).catch(() => '');
        details.category = await page.$eval('button[jsaction*="category"]', node => node.innerText.trim()).catch(() => '');
        details.address = await page.$eval('button[data-item-id="address"]', node => node.innerText.split('\n').pop().trim()).catch(() => '');
        details.website = await page.$eval('a[data-item-id="authority"]', node => node.href).catch(() => '');
        details.phone = await page.$eval('button[data-item-id*="phone"]', node => node.innerText.split('\n').pop().trim()).catch(() => '');
        details.description = await page.$eval('div[class*="PYv79b"]', node => node.innerText.trim()).catch(() => '');

        details.logo = await page.$eval('img[contenteditable="false"]', node => node.src).catch(() => '');

        if (details.website) {
            const siteData = await scrapeWebsiteData(context, details.website);
            details.email = siteData.email;
            if (siteData.logo) details.logo = siteData.logo;
            details.socials = siteData.socials;
        }

    } catch (e) {
        // Some fields might be missing
    }

    return details;
}

async function scrapeWebsiteData(context, url) {
    let newPage;
    const data = {
        email: '',
        logo: '',
        socials: {
            facebook: '',
            instagram: '',
            linkedin: '',
            twitter: ''
        }
    };

    try {
        newPage = await context.newPage();
        await newPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const content = await newPage.content();

        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = content.match(emailRegex);
        if (matches) {
            data.email = matches.filter(e => !e.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i))[0] || '';
        }

        data.logo = await newPage.evaluate(() => {
            const ogImg = document.querySelector('meta[property="og:image"]');
            if (ogImg) return ogImg.content;

            const logoSelectors = ['img[id*="logo"]', 'img[class*="logo"]', 'img[src*="logo"]'];
            for (let sel of logoSelectors) {
                const img = document.querySelector(sel);
                if (img && img.src) return img.src;
            }

            const favicon = document.querySelector('link[rel*="icon"]');
            if (favicon) return favicon.href;

            return '';
        });

        data.socials = await newPage.evaluate(() => {
            const result = { facebook: '', instagram: '', linkedin: '', twitter: '' };
            const links = Array.from(document.querySelectorAll('a[href]'));

            links.forEach(link => {
                const href = link.href.toLowerCase();
                if (href.includes('facebook.com') && !result.facebook) result.facebook = link.href;
                if (href.includes('instagram.com') && !result.instagram) result.instagram = link.href;
                if (href.includes('linkedin.com') && !result.linkedin) result.linkedin = link.href;
                if ((href.includes('twitter.com') || href.includes('x.com')) && !result.twitter) result.twitter = link.href;
            });
            return result;
        });

    } catch (e) {
        // Ignore errors
    } finally {
        if (newPage) await newPage.close();
    }
    return data;
}

module.exports = { scrapeGoogleMaps };
