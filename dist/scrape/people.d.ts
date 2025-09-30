import { PersonInfo } from '../types.js';
export declare class PeopleScraper {
    extractPeopleFromPage(html: string, sourceUrl: string): Promise<PersonInfo[]>;
    private extractFromLeadershipPage;
    private extractFromTeamPage;
    private extractFromContactPage;
    private extractFromAboutPage;
    private extractFromGenericPage;
    private extractPersonFromElement;
    private extractName;
    private extractTitle;
    private extractPhone;
    private extractEmail;
    private extractStructuredContactData;
    private extractPersonFromText;
    private looksLikeName;
    private looksLikePersonInfo;
}
//# sourceMappingURL=people.d.ts.map