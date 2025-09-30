import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { titleRegex, genericTitleRegex, phoneRegex, emailRegex } from '../config.js';
export function normalizePhone(phone) {
    if (!phone)
        return null;
    // Clean the phone number
    const cleaned = phone.replace(/[^\d+()\s-.]/g, '');
    try {
        // Try to parse as US number
        const parsed = parsePhoneNumber(cleaned, 'US');
        if (parsed && isValidPhoneNumber(parsed.number)) {
            return parsed.format('E.164');
        }
    }
    catch (error) {
        // Fallback to regex extraction
        const matches = cleaned.match(phoneRegex);
        if (matches && matches[0]) {
            const phone = matches[0].replace(/[^\d]/g, '');
            if (phone.length === 10) {
                return `+1${phone}`;
            }
            else if (phone.length === 11 && phone.startsWith('1')) {
                return `+${phone}`;
            }
        }
    }
    return null;
}
export function normalizeEmail(email) {
    if (!email)
        return null;
    const matches = email.match(emailRegex);
    if (matches && matches[0]) {
        return matches[0].toLowerCase().trim();
    }
    return null;
}
export function isValidTitle(title) {
    if (!title)
        return false;
    // Check for generic titles (exclude)
    if (genericTitleRegex.test(title)) {
        return false;
    }
    // Check for decision maker titles (include)
    return titleRegex.test(title);
}
export function extractCityState(location) {
    if (!location)
        return { city: '', state: '' };
    // Common patterns: "City, State", "City State", "City, ST"
    const patterns = [
        /^([^,]+),\s*([A-Z]{2})$/i, // "City, ST"
        /^([^,]+),\s*([A-Za-z\s]+)$/i, // "City, State"
        /^([A-Za-z\s]+)\s+([A-Z]{2})$/i, // "City ST"
    ];
    for (const pattern of patterns) {
        const match = location.match(pattern);
        if (match && match[1] && match[2]) {
            return {
                city: match[1].trim(),
                state: match[2].trim().toUpperCase()
            };
        }
    }
    // Fallback: try to extract state from end
    const stateMatch = location.match(/\b([A-Z]{2})\b$/);
    if (stateMatch && stateMatch[1]) {
        return {
            city: location.replace(/\b[A-Z]{2}\b$/, '').trim().replace(/,$/, ''),
            state: stateMatch[1]
        };
    }
    return { city: location, state: '' };
}
export function generateDedupeKey(lead) {
    const phone = lead.Phone?.replace(/[^\d]/g, '') || '';
    const email = lead.Email?.toLowerCase() || '';
    const nameCompany = `${lead.Name?.toLowerCase() || ''}${lead.Company?.toLowerCase() || ''}`;
    return phone || email || nameCompany;
}
export function isDuplicate(lead, existingLeads) {
    const key = generateDedupeKey(lead);
    return existingLeads.some(existing => {
        const existingKey = generateDedupeKey(existing);
        return existingKey && key && existingKey === key;
    });
}
export function randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
}
export function extractPhonesFromText(text) {
    const matches = text.match(phoneRegex);
    return matches ? matches.map(match => match.trim()) : [];
}
export function extractEmailsFromText(text) {
    const matches = text.match(emailRegex);
    return matches ? matches.map(match => match.toLowerCase().trim()) : [];
}
export function cleanCompanyName(name) {
    if (!name)
        return '';
    // Remove common suffixes and clean up
    return name
        .replace(/\b(inc|llc|ltd|corp|corporation|company|co)\b\.?$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
}
export function estimateCompanySize(text) {
    if (!text)
        return '';
    const sizePatterns = [
        { pattern: /(\d+)\s*-\s*(\d+)\s*employees/i, format: (min, max) => `${min}-${max} employees` },
        { pattern: /(\d+)\s*employees/i, format: (count) => `${count} employees` },
        { pattern: /(\d+)\s*-\s*(\d+)\s*people/i, format: (min, max) => `${min}-${max} employees` },
        { pattern: /(\d+)\s*people/i, format: (count) => `${count} employees` },
        { pattern: /\$(\d+(?:\.\d+)?)\s*million/i, format: (amount) => `$${amount}M revenue` },
        { pattern: /\$(\d+(?:\.\d+)?)\s*billion/i, format: (amount) => `$${amount}B revenue` },
    ];
    for (const { pattern, format } of sizePatterns) {
        const match = text.match(pattern);
        if (match && match[1] && match[2]) {
            return format(match[1], match[2]);
        }
    }
    return '';
}
//# sourceMappingURL=normalize.js.map