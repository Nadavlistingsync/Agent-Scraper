import { ConstructionLead } from '../types.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { logError, logProgress } from '../logger.js';

export class CSVExporter {
  
  async exportToCSV(leads: ConstructionLead[], filename?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const outputFile = filename || `leads-${timestamp}.csv`;
      const outputPath = join(process.cwd(), 'output', outputFile);

      // Create CSV header
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
        'Source URL',
        'Verified',
        'Lead Type',
        'Notes'
      ];

      // Create CSV rows
      const rows = leads.map(lead => [
        this.escapeCSV(lead.Name),
        this.escapeCSV(lead.Title),
        this.escapeCSV(lead.Company),
        this.escapeCSV(lead.Phone),
        this.escapeCSV(lead.Email),
        this.escapeCSV(lead.City),
        this.escapeCSV(lead.State),
        this.escapeCSV(lead.CompanySize),
        this.escapeCSV(lead.Website),
        this.escapeCSV(lead.SourceURL),
        this.escapeCSV(lead.Verified),
        this.escapeCSV(lead.LeadType || 'construction'),
        this.escapeCSV(lead.Notes)
      ]);

      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Ensure output directory exists
      await this.ensureOutputDir();

      // Write to file
      await writeFile(outputPath, csvContent, 'utf-8');

      logProgress(`✅ Exported ${leads.length} leads to CSV: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logError(error as Error, { context: 'CSVExporter.exportToCSV' });
      throw error;
    }
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    
    return value;
  }

  private async ensureOutputDir(): Promise<void> {
    const { mkdir } = await import('fs/promises');
    const outputDir = join(process.cwd(), 'output');
    
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
    }
  }

  async exportByType(leads: ConstructionLead[]): Promise<{ construction: string; realEstate: string }> {
    const constructionLeads = leads.filter(lead => lead.LeadType === 'construction');
    const realEstateLeads = leads.filter(lead => lead.LeadType === 'real-estate');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    const constructionPath = await this.exportToCSV(constructionLeads, `construction-leads-${timestamp}.csv`);
    const realEstatePath = await this.exportToCSV(realEstateLeads, `real-estate-leads-${timestamp}.csv`);

    return {
      construction: constructionPath,
      realEstate: realEstatePath
    };
  }
}

