export interface ConstructionLead {
    Name: string;
    Title: string;
    Company: string;
    Phone: string;
    Email: string;
    City: string;
    State: string;
    CompanySize: string;
    Website: string;
    SourceURL: string;
    Verified: 'Y' | 'N';
    Notes: string;
}
export interface CompanyInfo {
    name: string;
    website: string;
    leadershipPages: string[];
    contactPages: string[];
    aboutPages: string[];
}
export interface PersonInfo {
    name: string;
    title: string;
    phone?: string;
    email?: string;
    source: string;
}
export interface SearchResult {
    url: string;
    title: string;
    snippet: string;
}
export interface EnrichmentResult {
    phone?: string;
    email?: string;
    verified: boolean;
}
export interface ScrapingConfig {
    maxConcurrent: number;
    delayMin: number;
    delayMax: number;
    userAgents: string[];
}
//# sourceMappingURL=types.d.ts.map