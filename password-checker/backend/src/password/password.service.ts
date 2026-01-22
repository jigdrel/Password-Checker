import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { COMMON_PASSWORDS } from './data/common-passwords';

interface PasswordStrength {
  score: number; // 0-4 (weak to very strong)
  feedback: string[];
  isCommon: boolean;
  isPwned?: boolean;
  pwnedCount?: number;
  crackTime: string;
}

@Injectable()
export class PasswordService {
  constructor(private configService: ConfigService) {}

  async checkPassword(password: string): Promise<PasswordStrength> {
    const score = this.calculateScore(password);
    const feedback = this.generateFeedback(password, score);
    const isCommon = COMMON_PASSWORDS.has(password.toLowerCase());
    const crackTime = this.estimateCrackTime(password);

    return {
      score,
      feedback,
      isCommon,
      crackTime,
    };
  }

  async checkPwnedPassword(password: string): Promise<{ isPwned: boolean; count: number }> {
    try {
      // Hash the password using SHA-1
      const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Call HaveIBeenPwned API
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: {
          'Add-Padding': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check pwned passwords');
      }

      const data = await response.text();
      const hashes = data.split('\n');

      // Check if our hash suffix is in the response
      for (const line of hashes) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          return {
            isPwned: true,
            count: parseInt(count, 10),
          };
        }
      }

      return {
        isPwned: false,
        count: 0,
      };
    } catch (error) {
      // If API is unavailable, return safe default
      console.error('Error checking pwned passwords:', error.message);
      return {
        isPwned: false,
        count: 0,
      };
    }
  }

  private calculateScore(password: string): number {
    let score = 0;

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (password.length >= 16) score++;

    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Penalize common patterns
    if (/^[0-9]+$/.test(password)) score -= 2; // All numbers
    if (/^[a-zA-Z]+$/.test(password)) score -= 1; // All letters
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (/^(123|abc|qwe)/i.test(password)) score -= 1; // Common sequences

    // Normalize score to 0-4
    return Math.max(0, Math.min(4, Math.floor(score / 2)));
  }

  private generateFeedback(password: string, score: number): string[] {
    const feedback: string[] = [];

    // Length feedback
    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    } else if (password.length < 12) {
      feedback.push('Consider using at least 12 characters for better security');
    }

    // Character variety feedback
    if (!/[a-z]/.test(password)) {
      feedback.push('Add lowercase letters (a-z)');
    }
    if (!/[A-Z]/.test(password)) {
      feedback.push('Add uppercase letters (A-Z)');
    }
    if (!/[0-9]/.test(password)) {
      feedback.push('Add numbers (0-9)');
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      feedback.push('Add special characters (!@#$%^&*)');
    }

    // Pattern feedback
    if (/(.)\1{2,}/.test(password)) {
      feedback.push('Avoid repeated characters (e.g., "aaa", "111")');
    }
    if (/^(123|abc|qwe|password)/i.test(password)) {
      feedback.push('Avoid common sequences and words');
    }

    // Common password check
    if (COMMON_PASSWORDS.has(password.toLowerCase())) {
      feedback.push('⚠️ This is a commonly used password - DO NOT USE IT');
    }

    // Overall strength feedback
    if (score === 4) {
      feedback.push('✅ Excellent! This is a very strong password');
    } else if (score === 3) {
      feedback.push('👍 Good password strength');
    } else if (score === 2) {
      feedback.push('⚠️ Moderate strength - could be improved');
    } else if (score === 1) {
      feedback.push('⚠️ Weak password - please strengthen it');
    } else {
      feedback.push('❌ Very weak password - NOT RECOMMENDED');
    }

    return feedback;
  }

  private estimateCrackTime(password: string): string {
    // Simple estimation based on character space and length
    let charSpace = 0;
    if (/[a-z]/.test(password)) charSpace += 26;
    if (/[A-Z]/.test(password)) charSpace += 26;
    if (/[0-9]/.test(password)) charSpace += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charSpace += 32;

    const combinations = Math.pow(charSpace, password.length);
    
    // Assume 1 billion attempts per second (modern hardware)
    const attemptsPerSecond = 1_000_000_000;
    const secondsToCrack = combinations / attemptsPerSecond;

    if (secondsToCrack < 1) return 'Instant';
    if (secondsToCrack < 60) return `${Math.round(secondsToCrack)} seconds`;
    if (secondsToCrack < 3600) return `${Math.round(secondsToCrack / 60)} minutes`;
    if (secondsToCrack < 86400) return `${Math.round(secondsToCrack / 3600)} hours`;
    if (secondsToCrack < 2592000) return `${Math.round(secondsToCrack / 86400)} days`;
    if (secondsToCrack < 31536000) return `${Math.round(secondsToCrack / 2592000)} months`;
    
    const years = secondsToCrack / 31536000;
    if (years < 1000000) return `${Math.round(years).toLocaleString()} years`;
    if (years < 1000000000) return `${Math.round(years / 1000000).toLocaleString()} million years`;
    
    return 'Centuries';
  }
}