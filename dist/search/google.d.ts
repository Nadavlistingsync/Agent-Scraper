import { SearchResult } from '../types.js';
export declare class GoogleSearch {
    private isInitialized;
    initialize(): Promise<void>;
    searchConstructionCompanies(states?: string[]): Promise<SearchResult[]>;
    private generateSearchQueries;
    private performBrowserSearch;
    private deduplicateResults;
    close(): Promise<void>;
}
export declare const seedUrls: string[];
//# sourceMappingURL=google.d.ts.map