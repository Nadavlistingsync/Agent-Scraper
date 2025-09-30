import { CompanyInfo } from '../types.js';
export declare class CompanyScraper {
    private isInitialized;
    initialize(): Promise<void>;
    scrapeCompanyInfo(url: string): Promise<CompanyInfo | null>;
    private extractCompanyNameFromUrl;
    private extractCompanyName;
    private extractWebsite;
    private findLeadershipPages;
    private findContactPages;
    private findAboutPages;
    scrapePage(url: string): Promise<string>;
    close(): Promise<void>;
}
//# sourceMappingURL=company.d.ts.map