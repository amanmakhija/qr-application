import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

describe('MenuController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let adminToken: string;
  let adminId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);
    await app.init();

    // Create admin user and get token
    const hashedPassword = await bcrypt.hash('adminpass', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    adminId = admin.id;
    adminToken = jwtService.sign({ sub: admin.id, role: admin.role });
  });

  beforeEach(async () => {
    await prisma.menuItem.deleteMany();
  });

  afterAll(async () => {
    await prisma.menuItem.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('/menu (POST)', () => {
    const createMenuItemDto = {
      name: 'Test Item',
      description: 'Test Description',
      price: 9.99,
      category: 'Main Course',
    };

    it('should create a menu item when admin is authenticated', () => {
      return request(app.getHttpServer())
        .post('/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createMenuItemDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe(createMenuItemDto.name);
          expect(res.body.price).toBe(createMenuItemDto.price);
        });
    });

    it('should fail when not authenticated', () => {
      return request(app.getHttpServer())
        .post('/menu')
        .send(createMenuItemDto)
        .expect(401);
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/menu')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...createMenuItemDto,
          price: 'invalid-price',
        })
        .expect(400);
    });
  });

  describe('/menu (GET)', () => {
    beforeEach(async () => {
      await prisma.menuItem.createMany({
        data: [
          {
            name: 'Item 1',
            price: 9.99,
            category: 'Main Course',
            isAvailable: true,
          },
          {
            name: 'Item 2',
            price: 14.99,
            category: 'Dessert',
            isAvailable: true,
          },
        ],
      });
    });

    it('should return all available menu items', () => {
      return request(app.getHttpServer())
        .get('/menu')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('price');
        });
    });

    it('should return menu items by category', async () => {
      return request(app.getHttpServer())
        .get('/menu/category/Main Course')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(1);
          expect(res.body[0].category).toBe('Main Course');
        });
    });
  });

  describe('/menu/:id (PUT)', () => {
    let menuItemId: string;

    beforeEach(async () => {
      const menuItem = await prisma.menuItem.create({
        data: {
          name: 'Original Item',
          price: 9.99,
          category: 'Main Course',
        },
      });
      menuItemId = menuItem.id;
    });

    it('should update a menu item when admin is authenticated', () => {
      return request(app.getHttpServer())
        .put(`/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Item',
          price: 19.99,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Item');
          expect(res.body.price).toBe(19.99);
        });
    });

    it('should fail when menu item does not exist', () => {
      return request(app.getHttpServer())
        .put('/menu/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Item',
        })
        .expect(404);
    });
  });

  describe('/menu/:id (DELETE)', () => {
    let menuItemId: string;

    beforeEach(async () => {
      const menuItem = await prisma.menuItem.create({
        data: {
          name: 'Item to Delete',
          price: 9.99,
          category: 'Main Course',
        },
      });
      menuItemId = menuItem.id;
    });

    it('should delete a menu item when admin is authenticated', () => {
      return request(app.getHttpServer())
        .delete(`/menu/${menuItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should fail when menu item does not exist', () => {
      return request(app.getHttpServer())
        .delete('/menu/nonexistent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
