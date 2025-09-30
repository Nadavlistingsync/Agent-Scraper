import { ConstructionLead } from '../types.js';
export declare function normalizePhone(phone: string): string | null;
export declare function normalizeEmail(email: string): string | null;
export declare function isValidTitle(title: string): boolean;
export declare function extractCityState(location: string): {
    city: string;
    state: string;
};
export declare function generateDedupeKey(lead: ConstructionLead): string;
export declare function isDuplicate(lead: ConstructionLead, existingLeads: ConstructionLead[]): boolean;
export declare function randomDelay(min: number, max: number): Promise<void>;
export declare function extractPhonesFromText(text: string): string[];
export declare function extractEmailsFromText(text: string): string[];
export declare function cleanCompanyName(name: string): string;
export declare function estimateCompanySize(text: string): string;
//# sourceMappingURL=normalize.d.ts.map