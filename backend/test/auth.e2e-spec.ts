import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    await app.init();
  });

  beforeEach(async () => {
    // Clean up the database before each test
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.token).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user.role).toBe(Role.CUSTOMER);
        });
    });

    it('should not allow duplicate emails', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User 2',
        })
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.token).toBeDefined();
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('/auth/check-role (GET)', () => {
    let adminToken: string;
    let staffToken: string;
    let customerToken: string;

    beforeEach(async () => {
      // Create test users with different roles
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          password: 'password123',
          name: 'Admin User',
          role: Role.ADMIN,
        },
      });

      const staffUser = await prisma.user.create({
        data: {
          email: 'staff@example.com',
          password: 'password123',
          name: 'Staff User',
          role: Role.STAFF,
        },
      });

      const customerUser = await prisma.user.create({
        data: {
          email: 'customer@example.com',
          password: 'password123',
          name: 'Customer User',
          role: Role.CUSTOMER,
        },
      });

      // Generate tokens
      adminToken = jwtService.sign({ sub: adminUser.id, role: adminUser.role });
      staffToken = jwtService.sign({ sub: staffUser.id, role: staffUser.role });
      customerToken = jwtService.sign({
        sub: customerUser.id,
        role: customerUser.role,
      });
    });

    it('should identify admin user correctly', () => {
      return request(app.getHttpServer())
        .get('/auth/check-role')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect({
          isAdmin: true,
          isStaff: false,
        });
    });

    it('should identify staff user correctly', () => {
      return request(app.getHttpServer())
        .get('/auth/check-role')
        .set('Authorization', `Bearer ${staffToken}`)
        .expect(200)
        .expect({
          isAdmin: false,
          isStaff: true,
        });
    });

    it('should identify customer user correctly', () => {
      return request(app.getHttpServer())
        .get('/auth/check-role')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect({
          isAdmin: false,
          isStaff: false,
        });
    });

    it('should reject requests without token', () => {
      return request(app.getHttpServer()).get('/auth/check-role').expect(401);
    });

    it('should reject requests with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/check-role')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
