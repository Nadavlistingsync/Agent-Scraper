import { chromium, Browser, Page } from 'playwright';
import { SearchResult } from '../types.js';
import { scrapingConfig, companyTypes, decisionMakerTitles } from '../config.js';
import { logError, logProgress } from '../logger.js';
import { randomDelay } from '../util/normalize.js';

export class GoogleSearch {
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
      
      logProgress('Google search initialized');
    } catch (error) {
      logError(error as Error, { context: 'GoogleSearch.initialize' });
      throw error;
    }
  }

  async searchConstructionCompanies(states: string[] = []): Promise<SearchResult[]> {
    if (!this.page) {
      throw new Error('Google search not initialized');
    }

    const results: SearchResult[] = [];
    const searchQueries = this.generateSearchQueries(states);

    for (const query of searchQueries) {
      try {
        logProgress(`Searching: ${query}`);
        const queryResults = await this.performSearch(query);
        results.push(...queryResults);
        
        // Rate limiting
        await randomDelay(scrapingConfig.delayMin, scrapingConfig.delayMax);
        
        // Limit results to avoid overwhelming
        if (results.length >= 100) break;
        
      } catch (error) {
        logError(error as Error, { query, context: 'GoogleSearch.searchConstructionCompanies' });
        continue;
      }
    }

    return this.deduplicateResults(results);
  }

  private generateSearchQueries(states: string[]): string[] {
    const queries: string[] = [];
    
    // Base queries for each company type
    for (const companyType of companyTypes) {
      for (const title of decisionMakerTitles) {
        // Google search queries
        queries.push(`"${companyType}" "${title}" phone site:about OR team OR leadership`);
        queries.push(`"${companyType}" "${title}" contact`);
        queries.push(`"${companyType}" "${title}" "about us"`);
        
        // State-specific queries
        for (const state of states) {
          queries.push(`"${companyType}" "${title}" "${state}" phone`);
          queries.push(`"${companyType}" "${state}" contact information`);
        }
      }
    }

    // Trade association queries
    queries.push('AGC "Associated General Contractors" member directory');
    queries.push('ABC "Associated Builders and Contractors" local chapters');
    queries.push('state contractor license lookup directory');

    return queries.slice(0, 20); // Limit to prevent excessive requests
  }

  private async performSearch(query: string): Promise<SearchResult[]> {
    if (!this.page) return [];

    try {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      await this.page.goto(searchUrl, { waitUntil: 'networkidle' });
      
      // Wait for search results
      await this.page.waitForSelector('div[data-ved]', { timeout: 10000 });
      
      const results = await this.page.evaluate(() => {
        const searchResults: SearchResult[] = [];
        const resultElements = document.querySelectorAll('div[data-ved]');
        
        for (const element of resultElements) {
          const linkElement = element.querySelector('a[href^="http"]');
          const titleElement = element.querySelector('h3');
          const snippetElement = element.querySelector('span[data-ved]');
          
          if (linkElement && titleElement) {
            const url = linkElement.getAttribute('href');
            const title = titleElement.textContent?.trim() || '';
            const snippet = snippetElement?.textContent?.trim() || '';
            
            if (url && !url.includes('google.com') && !url.includes('youtube.com')) {
              searchResults.push({
                url,
                title,
                snippet
              });
            }
          }
        }
        
        return searchResults;
      });

      return results;
    } catch (error) {
      logError(error as Error, { query, context: 'GoogleSearch.performSearch' });
      return [];
    }
  }

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const key = result.url.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}

// Seed data for initial testing
export const seedUrls = [
  'https://www.agc.org/member-directory',
  'https://www.abc.org/find-a-chapter',
  'https://www.kiewit.com/about/leadership/',
  'https://www.turnerconstruction.com/about/leadership',
  'https://www.skanska.com/about-skanska/leadership/',
  'https://www.fluor.com/about/leadership',
  'https://www.bechtel.com/about/leadership/',
  'https://www.jacobs.com/about/leadership',
  'https://www.aecom.com/about/leadership/',
  'https://www.cbre.com/about/leadership'
];
