import { ConstructionLead } from '../types.js';
export declare class GoogleSheetsAppender {
    private sheets;
    private spreadsheetId;
    constructor();
    private initializeAuth;
    createSheetIfNotExists(): Promise<void>;
    private appendHeaders;
    appendLeads(leads: ConstructionLead[]): Promise<void>;
    getExistingLeads(): Promise<ConstructionLead[]>;
    getSheetUrl(): Promise<string>;
    getRowCount(): Promise<number>;
}
//# sourceMappingURL=append.d.ts.map