import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { ConstructionLead, PersonInfo } from '../types.js';
import { titleRegex, genericTitleRegex, phoneRegex, emailRegex } from '../config.js';

export function normalizePhone(phone: string): string | null {
  if (!phone) return null;
  
  // Clean the phone number
  const cleaned = phone.replace(/[^\d+()\s-.]/g, '');
  
  try {
    // Try to parse as US number
    const parsed = parsePhoneNumber(cleaned, 'US');
    if (parsed && isValidPhoneNumber(parsed.number)) {
      return parsed.format('E.164');
    }
  } catch (error) {
    // Fallback to regex extraction
    const matches = cleaned.match(phoneRegex);
    if (matches && matches[0]) {
      const phone = matches[0].replace(/[^\d]/g, '');
      if (phone.length === 10) {
        return `+1${phone}`;
      } else if (phone.length === 11 && phone.startsWith('1')) {
        return `+${phone}`;
      }
    }
  }
  
  return null;
}

export function normalizeEmail(email: string): string | null {
  if (!email) return null;
  
  const matches = email.match(emailRegex);
  if (matches && matches[0]) {
    return matches[0].toLowerCase().trim();
  }
  
  return null;
}

export function isValidTitle(title: string): boolean {
  if (!title) return false;
  
  // Check for generic titles (exclude)
  if (genericTitleRegex.test(title)) {
    return false;
  }
  
  // Check for decision maker titles (include)
  return titleRegex.test(title);
}

export function extractCityState(location: string): { city: string; state: string } {
  if (!location) return { city: '', state: '' };
  
  // Common patterns: "City, State", "City State", "City, ST"
  const patterns = [
    /^([^,]+),\s*([A-Z]{2})$/i,  // "City, ST"
    /^([^,]+),\s*([A-Za-z\s]+)$/i,  // "City, State"
    /^([A-Za-z\s]+)\s+([A-Z]{2})$/i,  // "City ST"
  ];
  
  for (const pattern of patterns) {
    const match = location.match(pattern);
    if (match) {
      return {
        city: match[1].trim(),
        state: match[2].trim().toUpperCase()
      };
    }
  }
  
  // Fallback: try to extract state from end
  const stateMatch = location.match(/\b([A-Z]{2})\b$/);
  if (stateMatch) {
    return {
      city: location.replace(/\b[A-Z]{2}\b$/, '').trim().replace(/,$/, ''),
      state: stateMatch[1]
    };
  }
  
  return { city: location, state: '' };
}

export function generateDedupeKey(lead: ConstructionLead): string {
  const phone = lead.Phone?.replace(/[^\d]/g, '') || '';
  const email = lead.Email?.toLowerCase() || '';
  const nameCompany = `${lead.Name?.toLowerCase() || ''}${lead.Company?.toLowerCase() || ''}`;
  
  return phone || email || nameCompany;
}

export function isDuplicate(lead: ConstructionLead, existingLeads: ConstructionLead[]): boolean {
  const key = generateDedupeKey(lead);
  
  return existingLeads.some(existing => {
    const existingKey = generateDedupeKey(existing);
    return existingKey && key && existingKey === key;
  });
}

export function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function extractPhonesFromText(text: string): string[] {
  const matches = text.match(phoneRegex);
  return matches ? matches.map(match => match.trim()) : [];
}

export function extractEmailsFromText(text: string): string[] {
  const matches = text.match(emailRegex);
  return matches ? matches.map(match => match.toLowerCase().trim()) : [];
}

export function cleanCompanyName(name: string): string {
  if (!name) return '';
  
  // Remove common suffixes and clean up
  return name
    .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b\.?$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function estimateCompanySize(text: string): string {
  if (!text) return '';
  
  const sizePatterns = [
    { pattern: /(\d+)\s*-\s*(\d+)\s*employees/i, format: (min: string, max: string) => `${min}-${max} employees` },
    { pattern: /(\d+)\s*employees/i, format: (count: string) => `${count} employees` },
    { pattern: /(\d+)\s*-\s*(\d+)\s*people/i, format: (min: string, max: string) => `${min}-${max} employees` },
    { pattern: /(\d+)\s*people/i, format: (count: string) => `${count} employees` },
    { pattern: /\$(\d+(?:\.\d+)?)\s*million/i, format: (amount: string) => `$${amount}M revenue` },
    { pattern: /\$(\d+(?:\.\d+)?)\s*billion/i, format: (amount: string) => `$${amount}B revenue` },
  ];
  
  for (const { pattern, format } of sizePatterns) {
    const match = text.match(pattern);
    if (match) {
      return format(match[1], match[2]);
    }
  }
  
  return '';
}
