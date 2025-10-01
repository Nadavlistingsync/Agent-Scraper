import { google } from 'googleapis';
import { config } from '../config.js';
import { logError, logProgress } from '../logger.js';
export class GoogleSheetsAppender {
    sheets;
    spreadsheetId;
    constructor() {
        this.spreadsheetId = config.googleSheets.sheetId;
        this.initializeAuth();
    }
    initializeAuth() {
        try {
            // Check if credentials are provided
            if (!config.googleSheets.serviceAccountEmail || !config.googleSheets.serviceAccountKey) {
                logProgress('Google Sheets credentials not configured - running in mock mode');
                this.sheets = null;
                return;
            }
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: config.googleSheets.serviceAccountEmail,
                    private_key: config.googleSheets.serviceAccountKey.replace(/\\n/g, '\n'),
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
            this.sheets = google.sheets({ version: 'v4', auth });
            logProgress('Google Sheets API initialized');
        }
        catch (error) {
            logError(error, { context: 'GoogleSheetsAppender.initializeAuth' });
            logProgress('Falling back to mock mode due to auth error');
            this.sheets = null;
        }
    }
    async createSheetIfNotExists() {
        try {
            if (!this.sheets) {
                logProgress('Mock mode: Sheet creation skipped');
                return;
            }
            // Check if sheet exists
            const response = await this.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId,
            });
            const sheetExists = response.data.sheets?.some((sheet) => sheet.properties.title === 'Construction DM');
            if (!sheetExists) {
                // Create the sheet
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
                    resource: {
                        requests: [
                            {
                                addSheet: {
                                    properties: {
                                        title: 'Construction DM',
                                    },
                                },
                            },
                        ],
                    },
                });
                // Add headers
                await this.appendHeaders();
                logProgress('Created "Construction DM" sheet with headers');
            }
        }
        catch (error) {
            logError(error, { context: 'GoogleSheetsAppender.createSheetIfNotExists' });
            logProgress('Falling back to mock mode due to sheet creation error');
        }
    }
    async appendHeaders() {
        if (!this.sheets) {
            logProgress('Mock mode: Headers skipped');
            return;
        }
        const headers = [
            'Name',
            'Title',
            'Company',
            'Phone',
            'Email',
            'City',
            'State',
            'Company Size',
            'Website',
            'SourceURL',
            'Verified',
            'Lead Type',
            'Notes'
        ];
        await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: 'Construction DM!A1:M1',
            valueInputOption: 'RAW',
            resource: {
                values: [headers],
            },
        });
    }
    async appendLeads(leads) {
        if (leads.length === 0)
            return;
        try {
            if (!this.sheets) {
                logProgress(`Mock mode: Would append ${leads.length} leads to Google Sheet`);
                leads.forEach((lead, index) => {
                    logProgress(`Mock lead ${index + 1}: ${lead.Name} - ${lead.Company} - ${lead.Phone}`);
                });
                return;
            }
            // Convert leads to rows
            const rows = leads.map(lead => [
                lead.Name,
                lead.Title,
                lead.Company,
                lead.Phone,
                lead.Email,
                lead.City,
                lead.State,
                lead.CompanySize,
                lead.Website,
                lead.SourceURL,
                lead.Verified,
                lead.LeadType || 'construction',
                lead.Notes
            ]);
            // Append to sheet
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Construction DM!A:M',
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: rows,
                },
            });
            logProgress(`Appended ${leads.length} leads to Google Sheet`);
        }
        catch (error) {
            logError(error, {
                leadCount: leads.length,
                context: 'GoogleSheetsAppender.appendLeads'
            });
            logProgress('Falling back to mock mode due to append error');
        }
    }
    async getExistingLeads() {
        try {
            if (!this.sheets) {
                logProgress('Mock mode: Returning empty existing leads list');
                return [];
            }
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Construction DM!A2:M', // Skip header row
            });
            const rows = response.data.values || [];
            const leads = [];
            for (const row of rows) {
                if (row.length >= 12) {
                    leads.push({
                        Name: row[0] || '',
                        Title: row[1] || '',
                        Company: row[2] || '',
                        Phone: row[3] || '',
                        Email: row[4] || '',
                        City: row[5] || '',
                        State: row[6] || '',
                        CompanySize: row[7] || '',
                        Website: row[8] || '',
                        SourceURL: row[9] || '',
                        Verified: row[10] || 'N',
                        LeadType: row[11] || 'construction',
                        Notes: row[12] || ''
                    });
                }
            }
            logProgress(`Retrieved ${leads.length} existing leads from Google Sheet`);
            return leads;
        }
        catch (error) {
            logError(error, { context: 'GoogleSheetsAppender.getExistingLeads' });
            logProgress('Mock mode: Returning empty existing leads due to error');
            return [];
        }
    }
    async getSheetUrl() {
        if (!this.sheets) {
            return 'Mock mode: No Google Sheet URL available';
        }
        return `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
    }
    async getRowCount() {
        try {
            if (!this.sheets) {
                logProgress('Mock mode: Returning 0 row count');
                return 0;
            }
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Construction DM!A:A',
            });
            const rows = response.data.values || [];
            return rows.length - 1; // Subtract header row
        }
        catch (error) {
            logError(error, { context: 'GoogleSheetsAppender.getRowCount' });
            logProgress('Mock mode: Returning 0 row count due to error');
            return 0;
        }
    }
}
//# sourceMappingURL=append.js.map