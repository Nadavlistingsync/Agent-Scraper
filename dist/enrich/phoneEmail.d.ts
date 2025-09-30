import { EnrichmentResult } from '../types.js';
export declare class PhoneEmailEnricher {
    enrichContact(name: string, company: string, existingPhone?: string, existingEmail?: string): Promise<EnrichmentResult>;
    private enrichWithApollo;
    private enrichWithHunter;
    private findBestNameMatch;
    private calculateNameSimilarity;
    private getCompanyDomain;
    private isDecisionMakerTitle;
    verifyPhone(phone: string): Promise<boolean>;
    verifyEmail(email: string): Promise<boolean>;
}
//# sourceMappingURL=phoneEmail.d.ts.map