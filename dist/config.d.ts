import { ScrapingConfig } from './types.js';
export declare const config: {
    readonly googleSheets: {
        readonly sheetId: string;
        readonly serviceAccountEmail: string;
        readonly serviceAccountKey: string;
    };
    readonly enrichment: {
        readonly apolloApiKey: string;
        readonly hunterApiKey: string;
    };
    readonly scraping: {
        readonly maxConcurrent: number;
        readonly delayMin: number;
        readonly delayMax: number;
    };
};
export declare const scrapingConfig: ScrapingConfig;
export declare const targetStates: string[];
export declare const companyTypes: string[];
export declare const decisionMakerTitles: string[];
export declare const titleRegex: RegExp;
export declare const phoneRegex: RegExp;
export declare const emailRegex: RegExp;
export declare const genericTitles: string[];
export declare const genericTitleRegex: RegExp;
//# sourceMappingURL=config.d.ts.map