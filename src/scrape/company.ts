import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { CompanyInfo } from '../types.js';
import { scrapingConfig } from '../config.js';
import { logError, logProgress } from '../logger.js';
import { randomDelay } from '../util/normalize.js';

export class CompanyScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    try {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      
      // Set random user agent
      const userAgent = scrapingConfig.userAgents[
        Math.floor(Math.random() * scrapingConfig.userAgents.length)
      ];
      await this.page.setUserAgent(userAgent);
      
      logProgress('Company scraper initialized');
    } catch (error) {
      logError(error as Error, { context: 'CompanyScraper.initialize' });
      throw error;
    }
  }

  async scrapeCompanyInfo(url: string): Promise<CompanyInfo | null> {
    if (!this.page) {
      throw new Error('Company scraper not initialized');
    }

    try {
      logProgress(`Scraping company: ${url}`);
      
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // Wait for page to load
      await randomDelay(2000, 4000);
      
      const content = await this.page.content();
      const $ = cheerio.load(content);
      
      const companyInfo: CompanyInfo = {
        name: this.extractCompanyName($, url),
        website: this.extractWebsite($, url),
        leadershipPages: this.findLeadershipPages($, url),
        contactPages: this.findContactPages($, url),
        aboutPages: this.findAboutPages($, url)
      };
      
      logProgress(`Found company: ${companyInfo.name}`);
      return companyInfo;
      
    } catch (error) {
      logError(error as Error, { url, context: 'CompanyScraper.scrapeCompanyInfo' });
      return null;
    }
  }

  private extractCompanyName($: cheerio.CheerioAPI, url: string): string {
    // Try multiple selectors for company name
    const selectors = [
      'h1',
      '.company-name',
      '.brand-name',
      '.logo-text',
      'title',
      'meta[property="og:title"]',
      'meta[name="title"]'
    ];
    
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        let name = element.text().trim() || element.attr('content') || '';
        
        if (name) {
          // Clean up the name
          name = name
            .replace(/\s*-\s*.*$/, '') // Remove everything after dash
            .replace(/\s*\|\s*.*$/, '') // Remove everything after pipe
            .replace(/\s*::\s*.*$/, '') // Remove everything after double colon
            .trim();
          
          if (name.length > 3 && name.length < 100) {
            return name;
          }
        }
      }
    }
    
    // Fallback: extract from URL
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      return hostname.split('.')[0].replace(/-/g, ' ').replace(/_/g, ' ');
    } catch {
      return 'Unknown Company';
    }
  }

  private extractWebsite($: cheerio.CheerioAPI, url: string): string {
    // Try to find canonical URL or og:url
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical) {
      try {
        const urlObj = new URL(canonical);
        return `${urlObj.protocol}//${urlObj.hostname}`;
      } catch {
        // Fallback to original URL
      }
    }
    
    const ogUrl = $('meta[property="og:url"]').attr('content');
    if (ogUrl) {
      try {
        const urlObj = new URL(ogUrl);
        return `${urlObj.protocol}//${urlObj.hostname}`;
      } catch {
        // Fallback to original URL
      }
    }
    
    // Fallback: extract from current URL
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}`;
    } catch {
      return url;
    }
  }

  private findLeadershipPages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const pages: string[] = [];
    const baseUrlObj = new URL(baseUrl);
    
    // Look for leadership-related links
    const leadershipSelectors = [
      'a[href*="leadership"]',
      'a[href*="team"]',
      'a[href*="management"]',
      'a[href*="executive"]',
      'a[href*="about"]',
      'a[href*="staff"]',
      'a[href*="people"]'
    ];
    
    for (const selector of leadershipSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const fullUrl = new URL(href, baseUrl).href;
            if (fullUrl.startsWith(baseUrlObj.origin) && !pages.includes(fullUrl)) {
              pages.push(fullUrl);
            }
          } catch {
            // Invalid URL, skip
          }
        }
      });
    }
    
    return pages.slice(0, 5); // Limit to 5 pages
  }

  private findContactPages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const pages: string[] = [];
    const baseUrlObj = new URL(baseUrl);
    
    // Look for contact-related links
    const contactSelectors = [
      'a[href*="contact"]',
      'a[href*="reach"]',
      'a[href*="connect"]',
      'a[href*="get-in-touch"]',
      'a[href*="location"]',
      'a[href*="office"]'
    ];
    
    for (const selector of contactSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const fullUrl = new URL(href, baseUrl).href;
            if (fullUrl.startsWith(baseUrlObj.origin) && !pages.includes(fullUrl)) {
              pages.push(fullUrl);
            }
          } catch {
            // Invalid URL, skip
          }
        }
      });
    }
    
    return pages.slice(0, 3); // Limit to 3 pages
  }

  private findAboutPages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const pages: string[] = [];
    const baseUrlObj = new URL(baseUrl);
    
    // Look for about-related links
    const aboutSelectors = [
      'a[href*="about"]',
      'a[href*="company"]',
      'a[href*="history"]',
      'a[href*="mission"]',
      'a[href*="values"]'
    ];
    
    for (const selector of aboutSelectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const fullUrl = new URL(href, baseUrl).href;
            if (fullUrl.startsWith(baseUrlObj.origin) && !pages.includes(fullUrl)) {
              pages.push(fullUrl);
            }
          } catch {
            // Invalid URL, skip
          }
        }
      });
    }
    
    return pages.slice(0, 3); // Limit to 3 pages
  }

  async scrapePage(url: string): Promise<string> {
    if (!this.page) {
      throw new Error('Company scraper not initialized');
    }

    try {
      await this.page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      await randomDelay(1000, 3000);
      
      return await this.page.content();
      
    } catch (error) {
      logError(error as Error, { url, context: 'CompanyScraper.scrapePage' });
      return '';
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
