import * as cheerio from 'cheerio';
import { PersonInfo } from '../types.js';
import { titleRegex, phoneRegex, emailRegex } from '../config.js';
import { logError, logProgress } from '../logger.js';
import { 
  normalizePhone, 
  normalizeEmail, 
  isValidTitle, 
  extractPhonesFromText, 
  extractEmailsFromText,
  extractCityState,
  estimateCompanySize
} from '../util/normalize.js';

export class PeopleScraper {
  
  async extractPeopleFromPage(html: string, sourceUrl: string): Promise<PersonInfo[]> {
    const $ = cheerio.load(html);
    const people: PersonInfo[] = [];
    
    try {
      // Try different page structures
      const extractionMethods = [
        () => this.extractFromLeadershipPage($, sourceUrl),
        () => this.extractFromTeamPage($, sourceUrl),
        () => this.extractFromContactPage($, sourceUrl),
        () => this.extractFromAboutPage($, sourceUrl),
        () => this.extractFromGenericPage($, sourceUrl)
      ];
      
      for (const method of extractionMethods) {
        try {
          const results = method();
          if (results.length > 0) {
            people.push(...results);
            break; // Use first successful method
          }
        } catch (error) {
          logError(error as Error, { sourceUrl, context: 'PeopleScraper.extractPeopleFromPage' });
          continue;
        }
      }
      
      // Filter and validate results
      const validPeople = people.filter(person => 
        person.name && 
        person.title && 
        isValidTitle(person.title) &&
        (person.phone || person.email)
      );
      
      logProgress(`Extracted ${validPeople.length} valid people from ${sourceUrl}`);
      return validPeople;
      
    } catch (error) {
      logError(error as Error, { sourceUrl, context: 'PeopleScraper.extractPeopleFromPage' });
      return [];
    }
  }

  private extractFromLeadershipPage($: cheerio.CheerioAPI, sourceUrl: string): PersonInfo[] {
    const people: PersonInfo[] = [];
    
    // Common selectors for leadership pages
    const selectors = [
      '.leadership-item',
      '.team-member',
      '.executive',
      '.management',
      '.person',
      '.staff-member',
      '[class*="leadership"]',
      '[class*="team"]',
      '[class*="executive"]'
    ];
    
    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const person = this.extractPersonFromElement($, $(element), sourceUrl);
        if (person) {
          people.push(person);
        }
      });
    }
    
    return people;
  }

  private extractFromTeamPage($: cheerio.CheerioAPI, sourceUrl: string): PersonInfo[] {
    const people: PersonInfo[] = [];
    
    // Look for team member cards
    const teamSelectors = [
      '.team-card',
      '.member-card',
      '.person-card',
      '.staff-card',
      '[class*="team"]',
      '[class*="member"]'
    ];
    
    for (const selector of teamSelectors) {
      $(selector).each((_, element) => {
        const person = this.extractPersonFromElement($, $(element), sourceUrl);
        if (person) {
          people.push(person);
        }
      });
    }
    
    return people;
  }

  private extractFromContactPage($: cheerio.CheerioAPI, sourceUrl: string): PersonInfo[] {
    const people: PersonInfo[] = [];
    
    // Look for contact information
    const contactSelectors = [
      '.contact-person',
      '.contact-info',
      '.staff-contact',
      '.office-contact',
      '[class*="contact"]'
    ];
    
    for (const selector of contactSelectors) {
      $(selector).each((_, element) => {
        const person = this.extractPersonFromElement($, $(element), sourceUrl);
        if (person) {
          people.push(person);
        }
      });
    }
    
    // Also look for structured contact data
    const structuredData = this.extractStructuredContactData($, sourceUrl);
    people.push(...structuredData);
    
    return people;
  }

  private extractFromAboutPage($: cheerio.CheerioAPI, sourceUrl: string): PersonInfo[] {
    const people: PersonInfo[] = [];
    
    // Look for about page content
    const aboutSelectors = [
      '.about-content',
      '.company-info',
      '.history',
      '.mission',
      '[class*="about"]'
    ];
    
    for (const selector of aboutSelectors) {
      $(selector).each((_, element) => {
        const person = this.extractPersonFromElement($, $(element), sourceUrl);
        if (person) {
          people.push(person);
        }
      });
    }
    
    return people;
  }

  private extractFromGenericPage($: cheerio.CheerioAPI, sourceUrl: string): PersonInfo[] {
    const people: PersonInfo[] = [];
    
    // Generic extraction - look for any elements that might contain person info
    const genericSelectors = [
      'div',
      'section',
      'article',
      'li'
    ];
    
    for (const selector of genericSelectors) {
      $(selector).each((_, element) => {
        const $element = $(element);
        const text = $element.text();
        
        // Check if this element contains person-like information
        if (this.looksLikePersonInfo(text)) {
          const person = this.extractPersonFromText(text, sourceUrl);
          if (person) {
            people.push(person);
          }
        }
      });
    }
    
    return people;
  }

  private extractPersonFromElement($: cheerio.CheerioAPI, $element: cheerio.Cheerio<any>, sourceUrl: string): PersonInfo | null {
    try {
      const text = $element.text();
      const html = $element.html() || '';
      
      // Extract name
      const name = this.extractName($element, text);
      if (!name) return null;
      
      // Extract title
      const title = this.extractTitle($element, text);
      if (!title || !isValidTitle(title)) return null;
      
      // Extract phone
      const phone = this.extractPhone($element, text, html);
      
      // Extract email
      const email = this.extractEmail($element, text, html);
      
      // Must have at least phone or email
      if (!phone && !email) return null;
      
      return {
        name: name.trim(),
        title: title.trim(),
        phone: phone || undefined,
        email: email || undefined,
        source: sourceUrl
      };
      
    } catch (error) {
      logError(error as Error, { sourceUrl, context: 'PeopleScraper.extractPersonFromElement' });
      return null;
    }
  }

  private extractName($element: cheerio.Cheerio<any>, text: string): string | null {
    // Try to find name in common selectors
    const nameSelectors = [
      'h1', 'h2', 'h3', 'h4',
      '.name', '.person-name', '.full-name',
      '[class*="name"]',
      'strong', 'b'
    ];
    
    for (const selector of nameSelectors) {
      const nameElement = $element.find(selector).first();
      if (nameElement.length) {
        const name = nameElement.text().trim();
        if (name && this.looksLikeName(name)) {
          return name;
        }
      }
    }
    
    // Fallback: extract from text
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    for (const line of lines) {
      if (this.looksLikeName(line)) {
        return line;
      }
    }
    
    return null;
  }

  private extractTitle($element: cheerio.Cheerio<any>, text: string): string | null {
    // Look for title in common selectors
    const titleSelectors = [
      '.title', '.position', '.role', '.job-title',
      '[class*="title"]', '[class*="position"]',
      'em', 'i'
    ];
    
    for (const selector of titleSelectors) {
      const titleElement = $element.find(selector).first();
      if (titleElement.length) {
        const title = titleElement.text().trim();
        if (title && titleRegex.test(title)) {
          return title;
        }
      }
    }
    
    // Fallback: look for title in text
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    for (const line of lines) {
      if (titleRegex.test(line)) {
        return line;
      }
    }
    
    return null;
  }

  private extractPhone($element: cheerio.Cheerio<any>, text: string, html: string): string | null {
    // Look for phone in links
    const phoneLinks = $element.find('a[href^="tel:"]');
    if (phoneLinks.length) {
      const phone = phoneLinks.first().attr('href')?.replace('tel:', '');
      if (phone) {
        return normalizePhone(phone) || null;
      }
    }
    
    // Extract from text
    const phones = extractPhonesFromText(text);
    if (phones.length > 0 && phones[0]) {
      return normalizePhone(phones[0]) || null;
    }
    
    return null;
  }

  private extractEmail($element: cheerio.Cheerio<any>, text: string, html: string): string | null {
    // Look for email in links
    const emailLinks = $element.find('a[href^="mailto:"]');
    if (emailLinks.length) {
      const email = emailLinks.first().attr('href')?.replace('mailto:', '');
      if (email) {
        return normalizeEmail(email) || null;
      }
    }
    
    // Extract from text
    const emails = extractEmailsFromText(text);
    if (emails.length > 0 && emails[0]) {
      return normalizeEmail(emails[0]) || null;
    }
    
    return null;
  }

  private extractStructuredContactData($: cheerio.CheerioAPI, sourceUrl: string): PersonInfo[] {
    const people: PersonInfo[] = [];
    
    // Look for structured contact data
    const contactBlocks = $('.contact, .office, .location, [class*="contact"]');
    
    contactBlocks.each((_, element) => {
      const $block = $(element);
      const text = $block.text();
      
      // Look for person-like information in contact blocks
      if (this.looksLikePersonInfo(text)) {
        const person = this.extractPersonFromText(text, sourceUrl);
        if (person) {
          people.push(person);
        }
      }
    });
    
    return people;
  }

  private extractPersonFromText(text: string, sourceUrl: string): PersonInfo | null {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let name = '';
    let title = '';
    let phone = '';
    let email = '';
    
    for (const line of lines) {
      if (!name && this.looksLikeName(line)) {
        name = line;
      } else if (!title && titleRegex.test(line)) {
        title = line;
      } else if (!phone) {
        const phones = extractPhonesFromText(line);
        if (phones.length > 0 && phones[0]) {
          const normalizedPhone = normalizePhone(phones[0]);
          phone = normalizedPhone || '';
        }
      } else if (!email) {
        const emails = extractEmailsFromText(line);
        if (emails.length > 0 && emails[0]) {
          const normalizedEmail = normalizeEmail(emails[0]);
          email = normalizedEmail || '';
        }
      }
    }
    
    if (name && title && isValidTitle(title) && (phone || email)) {
      return {
        name,
        title,
        phone: phone || undefined,
        email: email || undefined,
        source: sourceUrl
      };
    }
    
    return null;
  }

  private looksLikeName(text: string): boolean {
    if (!text || text.length < 2 || text.length > 50) return false;
    
    // Check for name patterns
    const namePatterns = [
      /^[A-Z][a-z]+ [A-Z][a-z]+$/,  // First Last
      /^[A-Z][a-z]+ [A-Z]\. [A-Z][a-z]+$/,  // First M. Last
      /^[A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+$/  // First Middle Last
    ];
    
    return namePatterns.some(pattern => pattern.test(text));
  }

  private looksLikePersonInfo(text: string): boolean {
    if (!text || text.length < 10) return false;
    
    // Check if text contains person-like information
    const hasName = /[A-Z][a-z]+ [A-Z][a-z]+/.test(text);
    const hasTitle = titleRegex.test(text);
    const hasPhone = phoneRegex.test(text);
    const hasEmail = emailRegex.test(text);
    
    return hasName && (hasTitle || hasPhone || hasEmail);
  }
}
