#!/usr/bin/env node

import { Command } from 'commander';
import pLimit from 'p-limit';
import { SimpleBrowserSearch } from './browser/simpleBrowserSearch.js';
import { SimpleBrowserScraper } from './browser/simpleBrowserScraper.js';
import { PeopleScraper } from './scrape/people.js';
import { GoogleSheetsAppender } from './sheets/append.js';
import { CSVExporter, JSONExporter, HTMLExporter } from './export/index.js';
import { ConstructionLead } from './types.js';
import { targetStates, scrapingConfig } from './config.js';
import { logProgress, logError } from './logger.js';
import { 
  isDuplicate, 
  extractCityState, 
  estimateCompanySize,
  randomDelay 
} from './util/normalize.js';

const program = new Command();

program
  .name('lead-generator')
  .description('Generate leads for construction companies and real estate agents')
  .version('1.0.0')
  .option('-l, --limit <number>', 'Maximum number of leads to collect', '50')
  .option('-s, --state <states>', 'Comma-separated list of states to focus on', '')
  .option('--csv', 'Export to CSV file')
  .option('--json', 'Export to JSON file')
  .option('--html', 'Export to HTML report')
  .option('--sheets', 'Export to Google Sheets')
  .option('--all-formats', 'Export to all formats (CSV, JSON, HTML)')
  .parse();

const options = program.opts();

interface ScrapingSession {
  browserSearch: SimpleBrowserSearch;
  browserScraper: SimpleBrowserScraper;
  peopleScraper: PeopleScraper;
  newLeads: ConstructionLead[];
  limit: number;
  states: string[];
}

async function main(): Promise<void> {
  try {
    logProgress('🚀 Starting lead generation for construction and real estate...');
    
    const session = await initializeSession();
    
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
    browserSearch: new SimpleBrowserSearch(),
    browserScraper: new SimpleBrowserScraper(),
    peopleScraper: new PeopleScraper(),
    newLeads: [],
    limit,
    states: validStates
  };
  
  // Initialize all components
  await session.browserSearch.initialize();
  await session.browserScraper.initialize();
  
  logProgress(`Initialized session with limit: ${limit}, states: ${validStates.join(', ') || 'all'}`);
  
  return session;
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
        
        if (processedCount % 5 === 0) {
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
    for (const pageUrl of allPages.slice(0, 2)) { // Limit to 2 pages per company
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

async function processPerson(
  session: ScrapingSession, 
  person: any, 
  companyInfo: any, 
  sourceUrl: string
): Promise<void> {
  try {
    // Determine lead type based on title
    const leadType = determineLeadType(person.title, companyInfo.name);
    
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
      Notes: '',
      LeadType: leadType
    };
    
    // Check for duplicates
    if (isDuplicate(lead, session.newLeads)) {
      return;
    }
    
    // Extract location information
    const location = extractCityState(companyInfo.name);
    lead.City = location.city;
    lead.State = location.state;
    
    // Estimate company size
    lead.CompanySize = estimateCompanySize(companyInfo.name);
    
    // Quality gates
    if (!lead.Phone && !lead.Email) {
      return; // Must have at least phone or email
    }
    
    if (!lead.Phone) {
      return; // Phone is required
    }
    
    // Add to new leads
    session.newLeads.push(lead);
    
    logProgress(`Found ${leadType} lead: ${lead.Name} - ${lead.Title} at ${lead.Company} (${lead.Phone})`);
    
  } catch (error) {
    logError(error as Error, { 
      person: person.name, 
      company: companyInfo.name, 
      context: 'processPerson' 
    });
  }
}

function determineLeadType(title: string, companyName: string): 'construction' | 'real-estate' {
  const realEstateKeywords = ['real estate', 'realtor', 'broker', 'agent', 'realty', 'property'];
  const constructionKeywords = ['construction', 'contractor', 'builder', 'ceo', 'coo', 'operations', 'estimator'];
  
  const titleLower = title.toLowerCase();
  const companyLower = companyName.toLowerCase();
  
  // Check title for real estate keywords
  if (realEstateKeywords.some(keyword => titleLower.includes(keyword))) {
    return 'real-estate';
  }
  
  // Check company name for real estate keywords
  if (realEstateKeywords.some(keyword => companyLower.includes(keyword))) {
    return 'real-estate';
  }
  
  // Default to construction
  return 'construction';
}

async function finalizeSession(session: ScrapingSession): Promise<void> {
  try {
    // Close all resources
    await session.browserSearch.close();
    await session.browserScraper.close();
    
    // Categorize leads
    const constructionLeads = session.newLeads.filter(lead => lead.LeadType === 'construction');
    const realEstateLeads = session.newLeads.filter(lead => lead.LeadType === 'real-estate');
    
    // Final summary
    logProgress('=== SCRAPING COMPLETE ===');
    logProgress(`Total leads found: ${session.newLeads.length}`);
    logProgress(`  - Construction leads: ${constructionLeads.length}`);
    logProgress(`  - Real estate leads: ${realEstateLeads.length}`);
    
    // Display sample construction leads
    if (constructionLeads.length > 0) {
      logProgress('\n🏗️  CONSTRUCTION LEADS (Sample):');
      constructionLeads.slice(0, 3).forEach((lead, index) => {
        logProgress(`${index + 1}. ${lead.Name} - ${lead.Title} at ${lead.Company}`);
        logProgress(`   Phone: ${lead.Phone}, Email: ${lead.Email}`);
        logProgress(`   Website: ${lead.Website}`);
      });
    }
    
    // Display sample real estate leads
    if (realEstateLeads.length > 0) {
      logProgress('\n🏠 REAL ESTATE LEADS (Sample):');
      realEstateLeads.slice(0, 3).forEach((lead, index) => {
        logProgress(`${index + 1}. ${lead.Name} - ${lead.Title} at ${lead.Company}`);
        logProgress(`   Phone: ${lead.Phone}, Email: ${lead.Email}`);
        logProgress(`   Website: ${lead.Website}`);
      });
    }
    
    // Export data based on options
    await exportData(session.newLeads);
    
    logProgress('\n=== END ===');
    
  } catch (error) {
    logError(error as Error, { context: 'finalizeSession' });
  }
}

async function exportData(leads: ConstructionLead[]): Promise<void> {
  if (leads.length === 0) {
    logProgress('\nNo leads to export');
    return;
  }

  const opts = options as any;
  const shouldExportAll = opts.allFormats;
  
  logProgress('\n📤 EXPORTING DATA...');
  
  try {
    // CSV Export
    if (opts.csv || shouldExportAll) {
      const csvExporter = new CSVExporter();
      const csvPath = await csvExporter.exportToCSV(leads);
      logProgress(`📊 CSV: ${csvPath}`);
    }
    
    // JSON Export
    if (opts.json || shouldExportAll) {
      const jsonExporter = new JSONExporter();
      const jsonPath = await jsonExporter.exportToJSON(leads);
      logProgress(`📋 JSON: ${jsonPath}`);
    }
    
    // HTML Export
    if (opts.html || shouldExportAll) {
      const htmlExporter = new HTMLExporter();
      const htmlPath = await htmlExporter.exportToHTML(leads);
      logProgress(`🌐 HTML: ${htmlPath}`);
      logProgress(`   Open in browser: file://${htmlPath}`);
    }
    
    // Google Sheets Export
    if (opts.sheets) {
      try {
        const sheetsAppender = new GoogleSheetsAppender();
        await sheetsAppender.createSheetIfNotExists();
        await sheetsAppender.appendLeads(leads);
        const sheetUrl = await sheetsAppender.getSheetUrl();
        logProgress(`📊 Google Sheets: ${sheetUrl}`);
      } catch (error) {
        logError(error as Error, { context: 'exportData.sheets' });
        logProgress('⚠️  Google Sheets export failed. Make sure you have configured the credentials in .env');
      }
    }
    
    // If no export option specified, export to all local formats
    if (!opts.csv && !opts.json && !opts.html && !opts.sheets && !shouldExportAll) {
      logProgress('ℹ️  No export format specified. Exporting to all local formats...');
      
      const csvExporter = new CSVExporter();
      const jsonExporter = new JSONExporter();
      const htmlExporter = new HTMLExporter();
      
      const csvPath = await csvExporter.exportToCSV(leads);
      const jsonPath = await jsonExporter.exportToJSON(leads);
      const htmlPath = await htmlExporter.exportToHTML(leads);
      
      logProgress(`📊 CSV: ${csvPath}`);
      logProgress(`📋 JSON: ${jsonPath}`);
      logProgress(`🌐 HTML: ${htmlPath}`);
      logProgress(`   Open in browser: file://${htmlPath}`);
    }
    
  } catch (error) {
    logError(error as Error, { context: 'exportData' });
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



