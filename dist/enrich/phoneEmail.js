import axios from 'axios';
import { config } from '../config.js';
import { logError, logProgress } from '../logger.js';
import { normalizePhone, normalizeEmail } from '../util/normalize.js';
export class PhoneEmailEnricher {
    async enrichContact(name, company, existingPhone, existingEmail) {
        const result = {
            phone: existingPhone || undefined,
            email: existingEmail || undefined,
            verified: false
        };
        try {
            // Try Apollo first if API key is available
            if (config.enrichment.apolloApiKey) {
                const apolloResult = await this.enrichWithApollo(name, company);
                if (apolloResult) {
                    result.phone = apolloResult.phone || result.phone || undefined;
                    result.email = apolloResult.email || result.email || undefined;
                    result.verified = apolloResult.verified;
                }
            }
            // Try Hunter if API key is available and we don't have email yet
            if (config.enrichment.hunterApiKey && !result.email) {
                const hunterResult = await this.enrichWithHunter(company);
                if (hunterResult) {
                    result.email = hunterResult.email || result.email || undefined;
                    result.verified = result.verified || hunterResult.verified;
                }
            }
            // Normalize results
            if (result.phone) {
                const normalizedPhone = normalizePhone(result.phone);
                result.phone = normalizedPhone || undefined;
            }
            if (result.email) {
                const normalizedEmail = normalizeEmail(result.email);
                result.email = normalizedEmail || undefined;
            }
            logProgress(`Enriched contact: ${name} at ${company}`, {
                phone: !!result.phone,
                email: !!result.email,
                verified: result.verified
            });
            return result;
        }
        catch (error) {
            logError(error, { name, company, context: 'PhoneEmailEnricher.enrichContact' });
            return result;
        }
    }
    async enrichWithApollo(name, company) {
        try {
            const response = await axios.get('https://api.apollo.io/v1/people/search', {
                headers: {
                    'Cache-Control': 'no-cache',
                    'X-Api-Key': config.enrichment.apolloApiKey
                },
                params: {
                    q_organization_name: company,
                    person_titles: ['Owner', 'President', 'CEO', 'COO', 'Managing Partner', 'VP Operations', 'Director of Operations', 'Head Estimator'],
                    page: 1,
                    per_page: 1
                }
            });
            if (response.data && response.data.people && response.data.people.length > 0) {
                const person = response.data.people[0];
                // Find the best match by name similarity
                const bestMatch = this.findBestNameMatch(name, response.data.people);
                if (bestMatch) {
                    return {
                        phone: bestMatch.phone_numbers?.[0]?.sanitized_number || bestMatch.phone_numbers?.[0]?.raw_number,
                        email: bestMatch.email,
                        verified: true
                    };
                }
            }
            return null;
        }
        catch (error) {
            logError(error, { name, company, context: 'PhoneEmailEnricher.enrichWithApollo' });
            return null;
        }
    }
    async enrichWithHunter(company) {
        try {
            // First, get domain from company name or website
            const domain = await this.getCompanyDomain(company);
            if (!domain)
                return null;
            const response = await axios.get('https://api.hunter.io/v2/domain-search', {
                params: {
                    domain: domain,
                    api_key: config.enrichment.hunterApiKey,
                    limit: 10
                }
            });
            if (response.data && response.data.data && response.data.data.emails) {
                const emails = response.data.data.emails;
                // Look for decision maker emails
                const decisionMakerEmail = emails.find((email) => email.position && this.isDecisionMakerTitle(email.position));
                if (decisionMakerEmail) {
                    return {
                        email: decisionMakerEmail.value,
                        verified: decisionMakerEmail.verification?.status === 'valid'
                    };
                }
            }
            return null;
        }
        catch (error) {
            logError(error, { company, context: 'PhoneEmailEnricher.enrichWithHunter' });
            return null;
        }
    }
    findBestNameMatch(targetName, people) {
        if (!targetName || !people.length)
            return null;
        const targetLower = targetName.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;
        for (const person of people) {
            const personName = `${person.first_name || ''} ${person.last_name || ''}`.toLowerCase().trim();
            if (!personName)
                continue;
            // Calculate similarity score
            const score = this.calculateNameSimilarity(targetLower, personName);
            if (score > bestScore && score > 0.7) { // 70% similarity threshold
                bestScore = score;
                bestMatch = person;
            }
        }
        return bestMatch;
    }
    calculateNameSimilarity(name1, name2) {
        const words1 = name1.split(' ').filter(w => w.length > 0);
        const words2 = name2.split(' ').filter(w => w.length > 0);
        if (words1.length === 0 || words2.length === 0)
            return 0;
        let matches = 0;
        for (const word1 of words1) {
            for (const word2 of words2) {
                if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
                    matches++;
                    break;
                }
            }
        }
        return matches / Math.max(words1.length, words2.length);
    }
    async getCompanyDomain(company) {
        try {
            // Try to find company website
            const response = await axios.get('https://api.apollo.io/v1/organizations/search', {
                headers: {
                    'Cache-Control': 'no-cache',
                    'X-Api-Key': config.enrichment.apolloApiKey
                },
                params: {
                    q_name: company,
                    page: 1,
                    per_page: 1
                }
            });
            if (response.data && response.data.organizations && response.data.organizations.length > 0) {
                const org = response.data.organizations[0];
                return org.website_url || null;
            }
            return null;
        }
        catch (error) {
            logError(error, { company, context: 'PhoneEmailEnricher.getCompanyDomain' });
            return null;
        }
    }
    isDecisionMakerTitle(title) {
        const decisionMakerTitles = [
            'Owner',
            'President',
            'Chief Executive',
            'CEO',
            'COO',
            'Managing Partner',
            'Vice President of Operations',
            'VP Operations',
            'Director of Operations',
            'Head Estimator'
        ];
        const titleLower = title.toLowerCase();
        return decisionMakerTitles.some(dmTitle => titleLower.includes(dmTitle.toLowerCase()));
    }
    async verifyPhone(phone) {
        try {
            // Basic phone validation
            if (!phone || phone.length < 10)
                return false;
            // Check if it's a valid US phone number format
            const usPhoneRegex = /^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
            const cleanedPhone = phone.replace(/[^\d]/g, '');
            return usPhoneRegex.test(cleanedPhone);
        }
        catch (error) {
            logError(error, { phone, context: 'PhoneEmailEnricher.verifyPhone' });
            return false;
        }
    }
    async verifyEmail(email) {
        try {
            // Basic email validation
            if (!email || !email.includes('@'))
                return false;
            const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
            return emailRegex.test(email);
        }
        catch (error) {
            logError(error, { email, context: 'PhoneEmailEnricher.verifyEmail' });
            return false;
        }
    }
}
//# sourceMappingURL=phoneEmail.js.map