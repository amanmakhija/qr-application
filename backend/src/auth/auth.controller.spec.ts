import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '@prisma/client';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.CUSTOMER,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: Role.CUSTOMER,
    };

    it('should register a new user', async () => {
      const expectedResult = {
        user: { ...mockUser },
        token: 'jwt-token',
      };

      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(
        registerDto.email,
        registerDto.password,
        registerDto.name,
        registerDto.role,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login a user', async () => {
      const expectedResult = {
        user: { ...mockUser },
        token: 'jwt-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
    });
  });

  describe('checkRole', () => {
    it('should identify admin user correctly', async () => {
      const adminUser = { ...mockUser, role: Role.ADMIN };
      const req = { user: adminUser };

      const result = await controller.checkRole(req);

      expect(result).toEqual({
        isAdmin: true,
        isStaff: false,
      });
    });

    it('should identify staff user correctly', async () => {
      const staffUser = { ...mockUser, role: Role.STAFF };
      const req = { user: staffUser };

      const result = await controller.checkRole(req);

      expect(result).toEqual({
        isAdmin: false,
        isStaff: true,
      });
    });

    it('should identify regular customer correctly', async () => {
      const req = { user: mockUser };

      const result = await controller.checkRole(req);

      expect(result).toEqual({
        isAdmin: false,
        isStaff: false,
      });
    });

    it('should handle missing user in request', async () => {
      const req = {};

      const result = await controller.checkRole(req);

      expect(result).toEqual({
        isAdmin: false,
        isStaff: false,
      });
    });
  });
});
