import { ConstructionLead } from '../types.js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { logError, logProgress } from '../logger.js';

export class HTMLExporter {
  
  async exportToHTML(leads: ConstructionLead[], filename?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const outputFile = filename || `leads-report-${timestamp}.html`;
      const outputPath = join(process.cwd(), 'output', outputFile);

      const constructionLeads = leads.filter(l => l.LeadType === 'construction');
      const realEstateLeads = leads.filter(l => l.LeadType === 'real-estate');

      const html = this.generateHTML(leads, constructionLeads, realEstateLeads);

      // Ensure output directory exists
      await this.ensureOutputDir();

      // Write to file
      await writeFile(outputPath, html, 'utf-8');

      logProgress(`✅ Exported ${leads.length} leads to HTML: ${outputPath}`);
      return outputPath;
    } catch (error) {
      logError(error as Error, { context: 'HTMLExporter.exportToHTML' });
      throw error;
    }
  }

  private generateHTML(allLeads: ConstructionLead[], constructionLeads: ConstructionLead[], realEstateLeads: ConstructionLead[]): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lead Generation Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-card h3 {
            color: #667eea;
            font-size: 2em;
            margin-bottom: 5px;
        }
        
        .stat-card p {
            color: #666;
            font-size: 0.9em;
        }
        
        .tabs {
            display: flex;
            background: #f8f9fa;
            border-bottom: 2px solid #dee2e6;
            padding: 0 30px;
        }
        
        .tab {
            padding: 15px 30px;
            cursor: pointer;
            border: none;
            background: transparent;
            font-size: 1em;
            color: #666;
            transition: all 0.3s;
            border-bottom: 3px solid transparent;
        }
        
        .tab:hover {
            color: #667eea;
        }
        
        .tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
            font-weight: 600;
        }
        
        .tab-content {
            display: none;
            padding: 30px;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .leads-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .leads-table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            position: sticky;
            top: 0;
        }
        
        .leads-table td {
            padding: 12px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .leads-table tr:hover {
            background: #f8f9fa;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .badge-construction {
            background: #ffc107;
            color: #000;
        }
        
        .badge-real-estate {
            background: #28a745;
            color: white;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #999;
        }
        
        .empty-state svg {
            width: 120px;
            height: 120px;
            margin-bottom: 20px;
            opacity: 0.3;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Lead Generation Report</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <h3>${allLeads.length}</h3>
                <p>Total Leads</p>
            </div>
            <div class="stat-card">
                <h3>${constructionLeads.length}</h3>
                <p>🏗️ Construction Leads</p>
            </div>
            <div class="stat-card">
                <h3>${realEstateLeads.length}</h3>
                <p>🏠 Real Estate Leads</p>
            </div>
        </div>
        
        <div class="tabs">
            <button class="tab active" onclick="showTab('all')">All Leads</button>
            <button class="tab" onclick="showTab('construction')">🏗️ Construction</button>
            <button class="tab" onclick="showTab('real-estate')">🏠 Real Estate</button>
        </div>
        
        <div id="all" class="tab-content active">
            ${this.generateLeadsTable(allLeads)}
        </div>
        
        <div id="construction" class="tab-content">
            ${this.generateLeadsTable(constructionLeads)}
        </div>
        
        <div id="real-estate" class="tab-content">
            ${this.generateLeadsTable(realEstateLeads)}
        </div>
    </div>
    
    <script>
        function showTab(tabName) {
            // Hide all tabs
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Remove active from all tab buttons
            document.querySelectorAll('.tab').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            
            // Add active to clicked button
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;
  }

  private generateLeadsTable(leads: ConstructionLead[]): string {
    if (leads.length === 0) {
      return `
        <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p>No leads found</p>
        </div>
      `;
    }

    return `
      <table class="leads-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Company</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Location</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(lead => `
            <tr>
              <td><strong>${this.escapeHTML(lead.Name)}</strong></td>
              <td>${this.escapeHTML(lead.Title)}</td>
              <td>${this.escapeHTML(lead.Company)}</td>
              <td>${this.escapeHTML(lead.Phone)}</td>
              <td>${this.escapeHTML(lead.Email)}</td>
              <td>${this.escapeHTML(lead.City ? `${lead.City}, ${lead.State}` : lead.State)}</td>
              <td>
                <span class="badge badge-${lead.LeadType === 'construction' ? 'construction' : 'real-estate'}">
                  ${lead.LeadType === 'construction' ? '🏗️ Construction' : '🏠 Real Estate'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  private escapeHTML(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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
}

