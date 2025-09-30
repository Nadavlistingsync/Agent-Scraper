import { scrapingConfig, companyTypes, decisionMakerTitles } from '../config.js';
import { logError, logProgress } from '../logger.js';
import { randomDelay } from '../util/normalize.js';
export class GoogleSearch {
    isInitialized = false;
    async initialize() {
        try {
            // Browser is already available through the browser automation tools
            this.isInitialized = true;
            logProgress('Google search initialized with browser automation');
        }
        catch (error) {
            logError(error, { context: 'GoogleSearch.initialize' });
            throw error;
        }
    }
    async searchConstructionCompanies(states = []) {
        if (!this.isInitialized) {
            throw new Error('Google search not initialized');
        }
        const results = [];
        const searchQueries = this.generateSearchQueries(states);
        for (const query of searchQueries) {
            try {
                logProgress(`Searching: ${query}`);
                const queryResults = await this.performBrowserSearch(query);
                results.push(...queryResults);
                // Rate limiting
                await randomDelay(scrapingConfig.delayMin, scrapingConfig.delayMax);
                // Limit results to avoid overwhelming
                if (results.length >= 100)
                    break;
            }
            catch (error) {
                logError(error, { query, context: 'GoogleSearch.searchConstructionCompanies' });
                continue;
            }
        }
        return this.deduplicateResults(results);
    }
    generateSearchQueries(states) {
        const queries = [];
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
    async performBrowserSearch(query) {
        try {
            // This method will be implemented to use the browser automation tools
            // For now, return empty array as we'll implement this step by step
            logProgress(`Browser search for: ${query}`);
            return [];
        }
        catch (error) {
            logError(error, { query, context: 'GoogleSearch.performBrowserSearch' });
            return [];
        }
    }
    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const key = result.url.toLowerCase();
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    async close() {
        // Browser cleanup is handled by the browser automation system
        this.isInitialized = false;
        logProgress('Google search closed');
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
//# sourceMappingURL=google.js.map