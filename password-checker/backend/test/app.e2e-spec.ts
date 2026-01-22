import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication', () => {
    const testUser = {
      email: 'e2e-test@example.com',
      password: 'TestPass123!',
      name: 'E2E Test User',
    };

    it('/auth/register (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body).not.toHaveProperty('password');
          userId = res.body.id;
        });
    });

    it('/auth/login (POST)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.requiresTwoFactor).toBe(false);
          authToken = res.body.access_token;
        });
    });

    it('/auth/login (POST) - invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });

  describe('Users (Protected Routes)', () => {
    it('/users/profile (GET) - without token', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });

    it('/users/profile (GET) - with token', () => {
      return request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('/users (GET) - regular user cannot access', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403); // Forbidden - only admins can access
    });
  });

  describe('Password Checker', () => {
    it('/password/check (POST) - without token', () => {
      return request(app.getHttpServer())
        .post('/password/check')
        .send({ password: 'Test123!' })
        .expect(401);
    });

    it('/password/check (POST) - weak password', () => {
      return request(app.getHttpServer())
        .post('/password/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: '123456' })
        .expect(201)
        .expect((res) => {
          expect(res.body.score).toBeLessThanOrEqual(1);
          expect(res.body.isCommon).toBe(true);
          expect(res.body.feedback).toBeDefined();
        });
    });

    it('/password/check (POST) - strong password', () => {
      return request(app.getHttpServer())
        .post('/password/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'MyS3cur3P@ssw0rd!2024' })
        .expect(201)
        .expect((res) => {
          expect(res.body.score).toBeGreaterThanOrEqual(3);
          expect(res.body.isCommon).toBe(false);
          expect(res.body.crackTime).toBeDefined();
        });
    });

    it('/password/check-pwned (POST)', () => {
      return request(app.getHttpServer())
        .post('/password/check-pwned')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'password123' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('isPwned');
          expect(res.body).toHaveProperty('count');
        });
    });
  });

  describe('2FA Flow', () => {
    let twoFactorSecret: string;

    it('/auth/2fa/enable (POST) - enable 2FA', () => {
      return request(app.getHttpServer())
        .post('/auth/2fa/enable')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: 'TestPass123!' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('secret');
          expect(res.body).toHaveProperty('qrCode');
          twoFactorSecret = res.body.secret;
        });
    });
  });
});