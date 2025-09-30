import { SearchResult } from '../types.js';
export declare class BrowserSearch {
    private isInitialized;
    initialize(): Promise<void>;
    searchConstructionCompanies(states?: string[]): Promise<SearchResult[]>;
    private generateSearchQueries;
    private performBrowserSearch;
    private navigateToGoogle;
    private performSearch;
    private extractSearchResults;
    private deduplicateResults;
    close(): Promise<void>;
}
//# sourceMappingURL=browserSearch.d.ts.map