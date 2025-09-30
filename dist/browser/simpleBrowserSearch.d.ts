import { SearchResult } from '../types.js';
export declare class SimpleBrowserSearch {
    private isInitialized;
    initialize(): Promise<void>;
    searchConstructionCompanies(states?: string[]): Promise<SearchResult[]>;
    private searchConstruction;
    private searchRealEstate;
    private generateSearchQueries;
    close(): Promise<void>;
}
//# sourceMappingURL=simpleBrowserSearch.d.ts.map