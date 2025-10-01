import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to read from the output directory
    const outputDir = path.join(process.cwd(), '..', 'output');
    
    try {
      const files = await fs.readdir(outputDir);
      const jsonFiles = files.filter(file => file.endsWith('.json')).sort().reverse();
      
      if (jsonFiles.length > 0) {
        const latestFile = jsonFiles[0];
        const filePath = path.join(outputDir, latestFile);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        
        return NextResponse.json({
          success: true,
          leads: data.leads || [],
          metadata: data.metadata || {},
          source: latestFile,
        });
      }
    } catch (err) {
      console.log('No output files found, returning sample data');
    }
    
    // Return sample data if no files found
    return NextResponse.json({
      success: true,
      leads: getSampleLeads(),
      metadata: {
        exportDate: new Date().toISOString(),
        totalLeads: 10,
        constructionLeads: 6,
        realEstateLeads: 4,
      },
      source: 'sample',
    });
  } catch (error) {
    console.error('Error in /api/leads:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch leads',
      leads: getSampleLeads(),
    }, { status: 500 });
  }
}

function getSampleLeads() {
  return [
    {
      Name: 'John Smith',
      Title: 'Chief Executive Officer',
      Company: 'Kiewit Corporation',
      Phone: '(555) 123-4567',
      Email: 'john.smith@kiewit.com',
      City: 'Omaha',
      State: 'NE',
      CompanySize: 'Large',
      Website: 'https://www.kiewit.com',
      SourceURL: 'https://www.kiewit.com/about/leadership/',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'construction' as const,
    },
    {
      Name: 'Sarah Johnson',
      Title: 'Chief Operating Officer',
      Company: 'Turner Construction',
      Phone: '(555) 234-5678',
      Email: 'sarah.johnson@turnerconstruction.com',
      City: 'New York',
      State: 'NY',
      CompanySize: 'Large',
      Website: 'https://www.turnerconstruction.com',
      SourceURL: 'https://www.turnerconstruction.com/about/leadership',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'construction' as const,
    },
    {
      Name: 'Jennifer Martinez',
      Title: 'Managing Broker',
      Company: 'CBRE',
      Phone: '(555) 111-2222',
      Email: 'jennifer.martinez@cbre.com',
      City: 'Los Angeles',
      State: 'CA',
      CompanySize: 'Large',
      Website: 'https://www.cbre.com',
      SourceURL: 'https://www.cbre.com/about/leadership',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'real-estate' as const,
    },
    {
      Name: 'Robert Chen',
      Title: 'Principal Broker',
      Company: 'Sotheby\'s International Realty',
      Phone: '(555) 222-3333',
      Email: 'robert.chen@sothebysrealty.com',
      City: 'San Francisco',
      State: 'CA',
      CompanySize: 'Large',
      Website: 'https://www.sothebysrealty.com',
      SourceURL: 'https://www.sothebysrealty.com/eng/associates',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'real-estate' as const,
    },
    {
      Name: 'Mike Davis',
      Title: 'Vice President of Operations',
      Company: 'Skanska USA',
      Phone: '(555) 345-6789',
      Email: 'mike.davis@skanska.com',
      City: 'Seattle',
      State: 'WA',
      CompanySize: 'Large',
      Website: 'https://www.skanska.com',
      SourceURL: 'https://www.skanska.com/about-skanska/leadership/',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'construction' as const,
    },
    {
      Name: 'Amanda Williams',
      Title: 'Real Estate Broker',
      Company: 'Coldwell Banker',
      Phone: '(555) 333-4444',
      Email: 'amanda.williams@coldwellbanker.com',
      City: 'Miami',
      State: 'FL',
      CompanySize: 'Medium',
      Website: 'https://www.coldwellbanker.com',
      SourceURL: 'https://www.coldwellbanker.com/agents',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'real-estate' as const,
    },
    {
      Name: 'David Thompson',
      Title: 'Director of Operations',
      Company: 'Fluor Corporation',
      Phone: '(555) 456-7890',
      Email: 'david.thompson@fluor.com',
      City: 'Irving',
      State: 'TX',
      CompanySize: 'Large',
      Website: 'https://www.fluor.com',
      SourceURL: 'https://www.fluor.com/about/leadership',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'construction' as const,
    },
    {
      Name: 'Maria Rodriguez',
      Title: 'Team Leader',
      Company: 'RE/MAX',
      Phone: '(555) 444-5555',
      Email: 'maria.rodriguez@remax.com',
      City: 'Chicago',
      State: 'IL',
      CompanySize: 'Large',
      Website: 'https://www.remax.com',
      SourceURL: 'https://www.remax.com/real-estate-agents',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'real-estate' as const,
    },
    {
      Name: 'Christopher Lee',
      Title: 'President',
      Company: 'Bechtel Corporation',
      Phone: '(555) 567-8901',
      Email: 'christopher.lee@bechtel.com',
      City: 'Reston',
      State: 'VA',
      CompanySize: 'Large',
      Website: 'https://www.bechtel.com',
      SourceURL: 'https://www.bechtel.com/about/leadership/',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'construction' as const,
    },
    {
      Name: 'Lisa Brown',
      Title: 'Project Manager',
      Company: 'Jacobs Engineering',
      Phone: '(555) 678-9012',
      Email: 'lisa.brown@jacobs.com',
      City: 'Dallas',
      State: 'TX',
      CompanySize: 'Large',
      Website: 'https://www.jacobs.com',
      SourceURL: 'https://www.jacobs.com/about/leadership',
      Verified: 'Y' as const,
      Notes: 'Sample data',
      LeadType: 'construction' as const,
    },
  ];
}

