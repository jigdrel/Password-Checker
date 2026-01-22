import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import { ConfigService } from '@nestjs/config';

describe('PasswordService', () => {
  let service: PasswordService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkPassword', () => {
    it('should return low score for weak password', async () => {
      const result = await service.checkPassword('123456');
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.isCommon).toBe(true);
    });

    it('should return high score for strong password', async () => {
      const result = await service.checkPassword('MyS3cur3P@ssw0rd!2024');
      expect(result.score).toBeGreaterThanOrEqual(3);
      expect(result.isCommon).toBe(false);
      expect(result.feedback).toBeDefined();
    });

    it('should detect common passwords', async () => {
      const result = await service.checkPassword('password');
      expect(result.isCommon).toBe(true);
      expect(result.feedback.some(f => f.includes('commonly used'))).toBe(true);
    });

    it('should provide feedback for missing character types', async () => {
      const result = await service.checkPassword('alllowercase');
      expect(result.feedback.some(f => f.includes('uppercase'))).toBe(true);
      expect(result.feedback.some(f => f.includes('numbers'))).toBe(true);
      expect(result.feedback.some(f => f.includes('special characters'))).toBe(true);
    });

    it('should estimate crack time', async () => {
      const result = await service.checkPassword('Test123!');
      expect(result.crackTime).toBeDefined();
      expect(typeof result.crackTime).toBe('string');
    });
  });

  describe('checkPwnedPassword', () => {
    it('should check if password is pwned', async () => {
      // Note: This test makes a real API call
      const result = await service.checkPwnedPassword('password123');
      expect(result).toHaveProperty('isPwned');
      expect(result).toHaveProperty('count');
      expect(typeof result.isPwned).toBe('boolean');
      expect(typeof result.count).toBe('number');
    });
  });
});