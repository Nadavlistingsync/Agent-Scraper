import { CompanyInfo } from '../types.js';
export declare class SimpleBrowserScraper {
    private isInitialized;
    initialize(): Promise<void>;
    scrapeCompanyInfo(url: string): Promise<CompanyInfo | null>;
    scrapePage(url: string): Promise<string>;
    private extractCompanyNameFromUrl;
    private extractWebsiteFromUrl;
    private generateLeadershipPages;
    private generateContactPages;
    private generateAboutPages;
    private generateSampleHtml;
    private generateConstructionHtml;
    private generateRealEstateHtml;
    close(): Promise<void>;
}
//# sourceMappingURL=simpleBrowserScraper.d.ts.map