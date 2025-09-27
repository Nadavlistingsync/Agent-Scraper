import dotenv from 'dotenv';
import { ScrapingConfig } from './types.js';

dotenv.config();

export const config = {
  googleSheets: {
    sheetId: process.env.GOOGLE_SHEET_ID || '',
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
  },
  enrichment: {
    apolloApiKey: process.env.APOLLO_API_KEY || '',
    hunterApiKey: process.env.HUNTER_API_KEY || '',
  },
  scraping: {
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_PAGES || '3'),
    delayMin: parseInt(process.env.REQUEST_DELAY_MIN || '2000'),
    delayMax: parseInt(process.env.REQUEST_DELAY_MAX || '6000'),
  },
} as const;

export const scrapingConfig: ScrapingConfig = {
  maxConcurrent: config.scraping.maxConcurrent,
  delayMin: config.scraping.delayMin,
  delayMax: config.scraping.delayMax,
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ],
};

export const targetStates = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export const companyTypes = [
  'general contractor',
  'design-build',
  'construction management',
  'HVAC contractor',
  'electrical contractor',
  'roofing contractor',
  'concrete contractor',
  'specialty contractor'
];

export const decisionMakerTitles = [
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
];

export const titleRegex = new RegExp(
  `(${decisionMakerTitles.join('|')})`,
  'i'
);

export const phoneRegex = /(\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g;
export const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

export const genericTitles = [
  'Agent',
  'Representative',
  'Coordinator',
  'Assistant',
  'Clerk',
  'Receptionist',
  'Intern'
];

export const genericTitleRegex = new RegExp(
  `(${genericTitles.join('|')})`,
  'i'
);
