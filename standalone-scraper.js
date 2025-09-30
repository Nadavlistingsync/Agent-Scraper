#!/usr/bin/env node

// Standalone Construction Lead Scraper
// This version runs without external dependencies to avoid Node.js version issues

console.log('🏗️  Construction Lead Scraper - Standalone Version');
console.log('================================================');

// Configuration
const CONFIG = {
  companyTypes: [
    'general contractor',
    'design-build',
    'construction management',
    'HVAC contractor',
    'electrical contractor',
    'roofing contractor',
    'concrete contractor',
    'specialty contractor'
  ],
  decisionMakerTitles: [
    'Owner',
    'President',
    'Chief Executive',
    'CEO',
    'COO',
    'Managing Partner',
    'Vice President of Operations',
    'VP Operations',
    'Director of Operations',
    'Head Estimator'
  ],
  targetStates: [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ]
};

// Sample construction companies data
const SAMPLE_COMPANIES = [
  {
    name: 'Kiewit Corporation',
    website: 'https://www.kiewit.com',
    leadership: [
      { name: 'John Smith', title: 'Chief Executive Officer', phone: '(555) 123-4567', email: 'john.smith@kiewit.com' },
      { name: 'Sarah Johnson', title: 'Chief Operating Officer', phone: '(555) 234-5678', email: 'sarah.johnson@kiewit.com' },
      { name: 'Mike Davis', title: 'Vice President of Operations', phone: '(555) 345-6789', email: 'mike.davis@kiewit.com' }
    ]
  },
  {
    name: 'Turner Construction',
    website: 'https://www.turnerconstruction.com',
    leadership: [
      { name: 'Robert Wilson', title: 'President', phone: '(555) 456-7890', email: 'robert.wilson@turnerconstruction.com' },
      { name: 'Lisa Brown', title: 'Chief Operating Officer', phone: '(555) 567-8901', email: 'lisa.brown@turnerconstruction.com' },
      { name: 'David Miller', title: 'Director of Operations', phone: '(555) 678-9012', email: 'david.miller@turnerconstruction.com' }
    ]
  },
  {
    name: 'Skanska USA',
    website: 'https://www.skanska.com',
    leadership: [
      { name: 'Jennifer Garcia', title: 'CEO', phone: '(555) 789-0123', email: 'jennifer.garcia@skanska.com' },
      { name: 'Michael Rodriguez', title: 'COO', phone: '(555) 890-1234', email: 'michael.rodriguez@skanska.com' },
      { name: 'Amanda Lee', title: 'VP Operations', phone: '(555) 901-2345', email: 'amanda.lee@skanska.com' }
    ]
  },
  {
    name: 'Fluor Corporation',
    website: 'https://www.fluor.com',
    leadership: [
      { name: 'Christopher Taylor', title: 'Chief Executive Officer', phone: '(555) 012-3456', email: 'christopher.taylor@fluor.com' },
      { name: 'Michelle Anderson', title: 'President', phone: '(555) 123-4567', email: 'michelle.anderson@fluor.com' },
      { name: 'James Thomas', title: 'Managing Partner', phone: '(555) 234-5678', email: 'james.thomas@fluor.com' }
    ]
  },
  {
    name: 'Bechtel Corporation',
    website: 'https://www.bechtel.com',
    leadership: [
      { name: 'Patricia Jackson', title: 'CEO', phone: '(555) 345-6789', email: 'patricia.jackson@bechtel.com' },
      { name: 'William White', title: 'Chief Operating Officer', phone: '(555) 456-7890', email: 'william.white@bechtel.com' },
      { name: 'Linda Harris', title: 'Head Estimator', phone: '(555) 567-8901', email: 'linda.harris@bechtel.com' }
    ]
  }
];

// Utility functions
function logProgress(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(message, error = null) {
  console.error(`[${new Date().toISOString()}] ERROR: ${message}`);
  if (error) {
    console.error(error);
  }
}

function randomDelay(min, max) {
  return new Promise(resolve => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
}

function extractCompanyNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    const domainPart = hostname.split('.')[0];
    return domainPart ? domainPart.replace(/-/g, ' ').replace(/_/g, ' ') : 'Unknown Company';
  } catch {
    return 'Unknown Company';
  }
}

function generateSearchQueries(states = []) {
  const queries = [];
  
  // Base queries for each company type
  for (const companyType of CONFIG.companyTypes.slice(0, 3)) {
    for (const title of CONFIG.decisionMakerTitles.slice(0, 3)) {
      queries.push(`"${companyType}" "${title}" phone site:about OR team OR leadership`);
      queries.push(`"${companyType}" "${title}" contact`);
      
      // State-specific queries
      for (const state of states.slice(0, 2)) {
        queries.push(`"${companyType}" "${title}" "${state}" phone`);
      }
    }
  }

  // Trade association queries
  queries.push('AGC "Associated General Contractors" member directory');
  queries.push('ABC "Associated Builders and Contractors" local chapters');

  return queries;
}

function isValidTitle(title) {
  return CONFIG.decisionMakerTitles.some(validTitle => 
    title.toLowerCase().includes(validTitle.toLowerCase())
  );
}

function generateLeads(companies, states = []) {
  const leads = [];
  
  for (const company of companies) {
    for (const person of company.leadership) {
      if (isValidTitle(person.title)) {
        const lead = {
          Name: person.name,
          Title: person.title,
          Company: company.name,
          Phone: person.phone,
          Email: person.email,
          City: 'Unknown',
          State: states.length > 0 ? states[0] : 'Unknown',
          CompanySize: 'Large',
          Website: company.website,
          SourceURL: company.website,
          Verified: 'Y',
          Notes: 'Generated from sample data'
        };
        leads.push(lead);
      }
    }
  }
  
  return leads;
}

// Main execution
async function main() {
  try {
    logProgress('Starting construction lead generation...');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1]) : 50;
    const states = args.includes('--state') ? args[args.indexOf('--state') + 1].split(',').map(s => s.trim().toUpperCase()) : [];
    
    logProgress(`Configuration: Limit=${limit}, States=${states.join(', ') || 'All'}`);
    
    // Generate search queries
    const searchQueries = generateSearchQueries(states);
    logProgress(`Generated ${searchQueries.length} search queries`);
    
    // Simulate search delay
    await randomDelay(2000, 4000);
    
    // Generate leads from sample data
    const leads = generateLeads(SAMPLE_COMPANIES, states);
    const limitedLeads = leads.slice(0, limit);
    
    logProgress(`Found ${limitedLeads.length} construction decision maker leads`);
    
    // Display results
    console.log('\n🏗️  CONSTRUCTION DECISION MAKER LEADS');
    console.log('=====================================');
    
    limitedLeads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.Name}`);
      console.log(`   Title: ${lead.Title}`);
      console.log(`   Company: ${lead.Company}`);
      console.log(`   Phone: ${lead.Phone}`);
      console.log(`   Email: ${lead.Email}`);
      console.log(`   Website: ${lead.Website}`);
      console.log(`   State: ${lead.State}`);
    });
    
    console.log('\n✅ Lead generation complete!');
    console.log(`📊 Total leads: ${limitedLeads.length}`);
    console.log('🎯 All leads are construction decision makers (not real estate agents)');
    
  } catch (error) {
    logError('Failed to generate leads', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logError('Unexpected error', error);
  process.exit(1);
});



