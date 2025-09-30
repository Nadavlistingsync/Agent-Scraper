#!/usr/bin/env node

import { Command } from 'commander';
import pLimit from 'p-limit';
import { GoogleSearch, seedUrls } from './search/google.js';
import { CompanyScraper } from './scrape/company.js';
import { BrowserSearch } from './browser/browserSearch.js';
import { BrowserScraper } from './browser/browserScraper.js';
import { PeopleScraper } from './scrape/people.js';
import { PhoneEmailEnricher } from './enrich/phoneEmail.js';
import { GoogleSheetsAppender } from './sheets/append.js';
import { ConstructionLead } from './types.js';
import { targetStates, scrapingConfig, config } from './config.js';
import { logProgress, logError } from './logger.js';
import { 
  isDuplicate, 
  extractCityState, 
  estimateCompanySize,
  randomDelay 
} from './util/normalize.js';

const program = new Command();

program
  .name('construction-lead-generator')
  .description('Generate leads for mid-market construction companies')
  .version('1.0.0')
  .option('-l, --limit <number>', 'Maximum number of leads to collect', '250')
  .option('-s, --state <states>', 'Comma-separated list of states to focus on', '')
  .option('--seed', 'Use seed URLs for initial testing', false)
  .parse();

const options = program.opts();

interface ScrapingSession {
  googleSearch: GoogleSearch;
  companyScraper: CompanyScraper;
  browserSearch: BrowserSearch;
  browserScraper: BrowserScraper;
  peopleScraper: PeopleScraper;
  enricher: PhoneEmailEnricher;
  sheetsAppender: GoogleSheetsAppender;
  existingLeads: ConstructionLead[];
  newLeads: ConstructionLead[];
  limit: number;
  states: string[];
}

async function main(): Promise<void> {
  try {
    logProgress('Starting construction lead generation...');
    
    const session = await initializeSession();
    await session.sheetsAppender.createSheetIfNotExists();
    
    // Get existing leads for deduplication
    session.existingLeads = await session.sheetsAppender.getExistingLeads();
    logProgress(`Found ${session.existingLeads.length} existing leads`);
    
    // Start with seed URLs if requested
    if (options.seed) {
      await processSeedUrls(session);
    }
    
    // Main scraping loop
    await processMainScraping(session);
    
    // Final summary
    await finalizeSession(session);
    
  } catch (error) {
    logError(error as Error, { context: 'main' });
    process.exit(1);
  }
}

async function initializeSession(): Promise<ScrapingSession> {
  const limit = parseInt(options.limit);
  const states = options.state ? options.state.split(',').map((s: string) => s.trim().toUpperCase()) : [];
  
  // Validate states
  const validStates = states.filter((state: string) => targetStates.includes(state));
  if (states.length > 0 && validStates.length === 0) {
    throw new Error(`Invalid states: ${states.join(', ')}. Valid states: ${targetStates.join(', ')}`);
  }
  
  const session: ScrapingSession = {
    googleSearch: new GoogleSearch(),
    companyScraper: new CompanyScraper(),
    browserSearch: new BrowserSearch(),
    browserScraper: new BrowserScraper(),
    peopleScraper: new PeopleScraper(),
    enricher: new PhoneEmailEnricher(),
    sheetsAppender: new GoogleSheetsAppender(),
    existingLeads: [],
    newLeads: [],
    limit,
    states: validStates
  };
  
  // Initialize all components
  await session.googleSearch.initialize();
  await session.companyScraper.initialize();
  await session.browserSearch.initialize();
  await session.browserScraper.initialize();
  
  logProgress(`Initialized session with limit: ${limit}, states: ${validStates.join(', ') || 'all'}`);
  
  return session;
}

async function processSeedUrls(session: ScrapingSession): Promise<void> {
  logProgress('Processing seed URLs...');
  
  const limit = pLimit(scrapingConfig.maxConcurrent);
  
  const seedPromises = seedUrls.map(url => 
    limit(async () => {
      try {
        await processUrl(session, url);
        await randomDelay(scrapingConfig.delayMin, scrapingConfig.delayMax);
      } catch (error) {
        logError(error as Error, { url, context: 'processSeedUrls' });
      }
    })
  );
  
  await Promise.all(seedPromises);
  
  logProgress(`Processed ${seedUrls.length} seed URLs`);
}

async function processMainScraping(session: ScrapingSession): Promise<void> {
  logProgress('Starting main scraping process...');
  
  // Search for construction companies using browser-based search
  const searchResults = await session.browserSearch.searchConstructionCompanies(session.states);
  logProgress(`Found ${searchResults.length} search results`);
  
  // Process search results
  const limit = pLimit(scrapingConfig.maxConcurrent);
  let processedCount = 0;
  
  for (const result of searchResults) {
    if (session.newLeads.length >= session.limit) {
      logProgress(`Reached limit of ${session.limit} leads`);
      break;
    }
    
    await limit(async () => {
      try {
        await processUrlWithBrowser(session, result.url);
        processedCount++;
        
        if (processedCount % 10 === 0) {
          logProgress(`Processed ${processedCount} URLs, found ${session.newLeads.length} leads`);
        }
        
        await randomDelay(scrapingConfig.delayMin, scrapingConfig.delayMax);
      } catch (error) {
        logError(error as Error, { url: result.url, context: 'processMainScraping' });
      }
    });
  }
  
  logProgress(`Completed main scraping: ${processedCount} URLs processed`);
}

async function processUrlWithBrowser(session: ScrapingSession, url: string): Promise<void> {
  try {
    // Scrape company information using browser scraper
    const companyInfo = await session.browserScraper.scrapeCompanyInfo(url);
    if (!companyInfo) return;
    
    // Get all relevant pages
    const allPages = [
      ...companyInfo.leadershipPages,
      ...companyInfo.contactPages,
      ...companyInfo.aboutPages
    ];
    
    if (allPages.length === 0) {
      // Fallback to main page
      allPages.push(url);
    }
    
    // Process each page
    for (const pageUrl of allPages.slice(0, 3)) { // Limit to 3 pages per company
      try {
        const html = await session.browserScraper.scrapePage(pageUrl);
        if (!html) continue;
        
        const people = await session.peopleScraper.extractPeopleFromPage(html, pageUrl);
        
        for (const person of people) {
          await processPerson(session, person, companyInfo, pageUrl);
        }
        
        await randomDelay(1000, 3000);
      } catch (error) {
        logError(error as Error, { pageUrl, context: 'processUrlWithBrowser' });
        continue;
      }
    }
    
  } catch (error) {
    logError(error as Error, { url, context: 'processUrlWithBrowser' });
  }
}

async function processUrl(session: ScrapingSession, url: string): Promise<void> {
  try {
    // Scrape company information
    const companyInfo = await session.companyScraper.scrapeCompanyInfo(url);
    if (!companyInfo) return;
    
    // Get all relevant pages
    const allPages = [
      ...companyInfo.leadershipPages,
      ...companyInfo.contactPages,
      ...companyInfo.aboutPages
    ];
    
    if (allPages.length === 0) {
      // Fallback to main page
      allPages.push(url);
    }
    
    // Process each page
    for (const pageUrl of allPages.slice(0, 3)) { // Limit to 3 pages per company
      try {
        const html = await session.companyScraper.scrapePage(pageUrl);
        if (!html) continue;
        
        const people = await session.peopleScraper.extractPeopleFromPage(html, pageUrl);
        
        for (const person of people) {
          await processPerson(session, person, companyInfo, pageUrl);
        }
        
        await randomDelay(1000, 3000);
      } catch (error) {
        logError(error as Error, { pageUrl, context: 'processUrl' });
        continue;
      }
    }
    
  } catch (error) {
    logError(error as Error, { url, context: 'processUrl' });
  }
}

async function processPerson(
  session: ScrapingSession, 
  person: any, 
  companyInfo: any, 
  sourceUrl: string
): Promise<void> {
  try {
    // Create lead object
    const lead: ConstructionLead = {
      Name: person.name,
      Title: person.title,
      Company: companyInfo.name,
      Phone: person.phone || '',
      Email: person.email || '',
      City: '',
      State: '',
      CompanySize: '',
      Website: companyInfo.website,
      SourceURL: sourceUrl,
      Verified: 'N',
      Notes: ''
    };
    
    // Check for duplicates
    if (isDuplicate(lead, [...session.existingLeads, ...session.newLeads])) {
      return;
    }
    
    // Enrich contact information
    if (config.enrichment.apolloApiKey || config.enrichment.hunterApiKey) {
      const enrichment = await session.enricher.enrichContact(
        person.name, 
        companyInfo.name, 
        person.phone, 
        person.email
      );
      
      if (enrichment.phone) lead.Phone = enrichment.phone;
      if (enrichment.email) lead.Email = enrichment.email;
      if (enrichment.verified) lead.Verified = 'Y';
    }
    
    // Extract location information
    const location = extractCityState(companyInfo.name); // Fallback
    lead.City = location.city;
    lead.State = location.state;
    
    // Estimate company size
    lead.CompanySize = estimateCompanySize(companyInfo.name); // Fallback
    
    // Quality gates
    if (!lead.Phone && !lead.Email) {
      return; // Must have at least phone or email
    }
    
    if (!lead.Phone) {
      return; // Phone is required
    }
    
    // Add to new leads
    session.newLeads.push(lead);
    
    // Batch append to Google Sheets every 10 leads
    if (session.newLeads.length % 10 === 0) {
      await session.sheetsAppender.appendLeads(session.newLeads);
      session.existingLeads.push(...session.newLeads);
      session.newLeads = [];
    }
    
  } catch (error) {
    logError(error as Error, { 
      person: person.name, 
      company: companyInfo.name, 
      context: 'processPerson' 
    });
  }
}

async function finalizeSession(session: ScrapingSession): Promise<void> {
  try {
    // Append remaining leads
    if (session.newLeads.length > 0) {
      await session.sheetsAppender.appendLeads(session.newLeads);
    }
    
    // Get final count
    const totalLeads = await session.sheetsAppender.getRowCount();
    const sheetUrl = await session.sheetsAppender.getSheetUrl();
    
    // Close all resources
    await session.googleSearch.close();
    await session.companyScraper.close();
    await session.browserSearch.close();
    await session.browserScraper.close();
    
    // Final summary
    logProgress('=== SCRAPING COMPLETE ===');
    logProgress(`Total leads in sheet: ${totalLeads}`);
    logProgress(`New leads added: ${session.newLeads.length}`);
    logProgress(`Google Sheet URL: ${sheetUrl}`);
    logProgress('=== END ===');
    
  } catch (error) {
    logError(error as Error, { context: 'finalizeSession' });
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logProgress('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logProgress('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Run the main function
main().catch(error => {
  logError(error as Error, { context: 'main' });
  process.exit(1);
});
