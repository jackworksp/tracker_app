const puppeteer = require('puppeteer');

async function getInstagramReelData(url) {
  console.log(`🚀 Launching browser to scrape: ${url}`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--lang=en-US,en'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set realistic browser behavior
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    });
    
    // Navigate to the URL
    console.log('📄 Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait a bit for dynamic content
    try {
        await page.waitForSelector('meta[property="og:description"]', { timeout: 10000 });
    } catch (e) {
        console.log('ℹ️ Meta tags not immediately found, waiting extra time...');
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log('🔎 Extracting data...');
    
    // Extract all data
    const reelData = await page.evaluate(() => {
      const data = {
        title: null,
        description: null,
        thumbnail: null
      };
      
      // Strategy 1: Get from meta tags (most reliable)
      const ogDescription = document.querySelector('meta[property="og:description"]');
      const ogImage = document.querySelector('meta[property="og:image"]');
      
      if (ogDescription?.content) {
        // Clean up the description (remove Instagram's suffix like "123 likes, 45 comments")
        let fullCaption = ogDescription.content;
        
        // Remove trailing metadata like "• 1,234 likes, 56 comments • ..."
        fullCaption = fullCaption.split(' •')[0].trim();
        fullCaption = fullCaption.split(' - ')[0].trim(); 
        
        data.description = fullCaption;
        
        // Extract first line as title (up to first newline or 80 chars)
        const firstLineMatch = fullCaption.match(/^(.+?)(?:\n|$)/);
        if (firstLineMatch) {
          data.title = firstLineMatch[1].trim();
        } else {
          // If no newline, take first 80 chars
          data.title = fullCaption.length > 80 
            ? fullCaption.substring(0, 80) + '...' 
            : fullCaption;
        }
      }
      
      // Get thumbnail from og:image
      if (ogImage?.content) {
        data.thumbnail = ogImage.content;
      }
      
      return data;
    });
    
    console.log('✅ Data extracted successfully:', reelData);
    
    return reelData;

  } catch (error) {
    console.error('❌ Error scraping:', error.message);
    return {
      title: null,
      description: null,
      thumbnail: null,
      error: error.message
    };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { getInstagramReelData };
