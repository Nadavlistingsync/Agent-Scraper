import { ConstructionLead } from '../types.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { logError, logProgress } from '../logger.js';

export class JSONExporter {
  
  async exportToJSON(leads: ConstructionLead[], filename?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const outputFile = filename || `leads-${timestamp}.json`;
      const outputPath = join(process.cwd(), 'output', outputFile);

      // Create JSON structure with metadata
      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          totalLeads: leads.length,
          constructionLeads: leads.filter(l => l.LeadType === 'construction').length,
          realEstateLeads: leads.filter(l => l.LeadType === 'real-estate').length
        },
        leads: leads
      };

      // Ensure output directory exists
      await this.ensureOutputDir();

      // Write to file with pretty formatting
      await writeFile(outputPath, JSON.stringify(exportData, null, 2), 'utf-8');

      logProgress(`✅ Exported ${leads.length} leads to JSON: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logError(error as Error, { context: 'JSONExporter.exportToJSON' });
      throw error;
    }
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
    
    const constructionPath = await this.exportToJSON(constructionLeads, `construction-leads-${timestamp}.json`);
    const realEstatePath = await this.exportToJSON(realEstateLeads, `real-estate-leads-${timestamp}.json`);

    return {
      construction: constructionPath,
      realEstate: realEstatePath
    };
  }
}

