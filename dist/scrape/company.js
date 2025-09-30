import { logError, logProgress } from '../logger.js';
export class CompanyScraper {
    isInitialized = false;
    async initialize() {
        try {
            // Browser is already available through the browser automation tools
            this.isInitialized = true;
            logProgress('Company scraper initialized with browser automation');
        }
        catch (error) {
            logError(error, { context: 'CompanyScraper.initialize' });
            throw error;
        }
    }
    async scrapeCompanyInfo(url) {
        if (!this.isInitialized) {
            throw new Error('Company scraper not initialized');
        }
        try {
            logProgress(`Scraping company: ${url}`);
            // This will be implemented to use browser automation
            // For now, return a basic company info structure
            const companyInfo = {
                name: this.extractCompanyNameFromUrl(url),
                website: url,
                leadershipPages: [],
                contactPages: [],
                aboutPages: []
            };
            logProgress(`Found company: ${companyInfo.name}`);
            return companyInfo;
        }
        catch (error) {
            logError(error, { url, context: 'CompanyScraper.scrapeCompanyInfo' });
            return null;
        }
    }
    extractCompanyNameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace('www.', '');
            const domainPart = hostname.split('.')[0];
            return domainPart ? domainPart.replace(/-/g, ' ').replace(/_/g, ' ') : 'Unknown Company';
        }
        catch {
            return 'Unknown Company';
        }
    }
    extractCompanyName($, url) {
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
            const domainPart = hostname.split('.')[0];
            return domainPart ? domainPart.replace(/-/g, ' ').replace(/_/g, ' ') : 'Unknown Company';
        }
        catch {
            return 'Unknown Company';
        }
    }
    extractWebsite($, url) {
        // Try to find canonical URL or og:url
        const canonical = $('link[rel="canonical"]').attr('href');
        if (canonical) {
            try {
                const urlObj = new URL(canonical);
                return `${urlObj.protocol}//${urlObj.hostname}`;
            }
            catch {
                // Fallback to original URL
            }
        }
        const ogUrl = $('meta[property="og:url"]').attr('content');
        if (ogUrl) {
            try {
                const urlObj = new URL(ogUrl);
                return `${urlObj.protocol}//${urlObj.hostname}`;
            }
            catch {
                // Fallback to original URL
            }
        }
        // Fallback: extract from current URL
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.hostname}`;
        }
        catch {
            return url;
        }
    }
    findLeadershipPages($, baseUrl) {
        const pages = [];
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
                    }
                    catch {
                        // Invalid URL, skip
                    }
                }
            });
        }
        return pages.slice(0, 5); // Limit to 5 pages
    }
    findContactPages($, baseUrl) {
        const pages = [];
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
                    }
                    catch {
                        // Invalid URL, skip
                    }
                }
            });
        }
        return pages.slice(0, 3); // Limit to 3 pages
    }
    findAboutPages($, baseUrl) {
        const pages = [];
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
                    }
                    catch {
                        // Invalid URL, skip
                    }
                }
            });
        }
        return pages.slice(0, 3); // Limit to 3 pages
    }
    async scrapePage(url) {
        if (!this.isInitialized) {
            throw new Error('Company scraper not initialized');
        }
        try {
            // This will be implemented to use browser automation
            // For now, return empty string
            logProgress(`Scraping page: ${url}`);
            return '';
        }
        catch (error) {
            logError(error, { url, context: 'CompanyScraper.scrapePage' });
            return '';
        }
    }
    async close() {
        // Browser cleanup is handled by the browser automation system
        this.isInitialized = false;
        logProgress('Company scraper closed');
    }
}
//# sourceMappingURL=company.js.map