import { CompanyInfo } from '../types.js';
export declare class BrowserScraper {
    private isInitialized;
    initialize(): Promise<void>;
    scrapeCompanyInfo(url: string): Promise<CompanyInfo | null>;
    scrapePage(url: string): Promise<string>;
    private navigateToUrl;
    private getPageContent;
    private extractCompanyName;
    private extractWebsite;
    private findLeadershipPages;
    private findContactPages;
    private findAboutPages;
    close(): Promise<void>;
}
//# sourceMappingURL=browserScraper.d.ts.map