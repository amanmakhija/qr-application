import { Test, TestingModule } from '@nestjs/testing';
import { MenuService } from './menu.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('MenuService', () => {
  let service: MenuService;
  let prisma: PrismaService;

  const mockPrismaService = {
    menuItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MenuService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MenuService>(MenuService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllMenuItems', () => {
    it('should return all available menu items', async () => {
      const mockMenuItems = [
        { id: '1', name: 'Item 1', isAvailable: true },
        { id: '2', name: 'Item 2', isAvailable: true },
      ];

      mockPrismaService.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const result = await service.getAllMenuItems();
      expect(result).toEqual(mockMenuItems);
      expect(mockPrismaService.menuItem.findMany).toHaveBeenCalledWith({
        where: { isAvailable: true },
      });
    });
  });

  describe('getMenuItemById', () => {
    it('should return a menu item if found', async () => {
      const mockMenuItem = { id: '1', name: 'Item 1' };
      mockPrismaService.menuItem.findUnique.mockResolvedValue(mockMenuItem);

      const result = await service.getMenuItemById('1');
      expect(result).toEqual(mockMenuItem);
    });

    it('should throw NotFoundException if menu item not found', async () => {
      mockPrismaService.menuItem.findUnique.mockResolvedValue(null);

      await expect(service.getMenuItemById('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createMenuItem', () => {
    const createMenuItemDto = {
      name: 'New Item',
      price: 9.99,
      category: 'Main Course',
    };

    it('should create and return a new menu item', async () => {
      const mockMenuItem = { id: '1', ...createMenuItemDto };
      mockPrismaService.menuItem.create.mockResolvedValue(mockMenuItem);

      const result = await service.createMenuItem(createMenuItemDto);
      expect(result).toEqual(mockMenuItem);
      expect(mockPrismaService.menuItem.create).toHaveBeenCalledWith({
        data: createMenuItemDto,
      });
    });
  });

  describe('updateMenuItem', () => {
    const updateMenuItemDto = {
      name: 'Updated Item',
      price: 19.99,
    };

    it('should update and return the menu item if found', async () => {
      const mockMenuItem = { id: '1', ...updateMenuItemDto };
      mockPrismaService.menuItem.findUnique.mockResolvedValue(mockMenuItem);
      mockPrismaService.menuItem.update.mockResolvedValue(mockMenuItem);

      const result = await service.updateMenuItem('1', updateMenuItemDto);
      expect(result).toEqual(mockMenuItem);
    });

    it('should throw NotFoundException if menu item not found', async () => {
      mockPrismaService.menuItem.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMenuItem('1', updateMenuItemDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteMenuItem', () => {
    it('should delete and return the menu item if found', async () => {
      const mockMenuItem = { id: '1', name: 'Item to Delete' };
      mockPrismaService.menuItem.findUnique.mockResolvedValue(mockMenuItem);
      mockPrismaService.menuItem.delete.mockResolvedValue(mockMenuItem);

      const result = await service.deleteMenuItem('1');
      expect(result).toEqual(mockMenuItem);
    });

    it('should throw NotFoundException if menu item not found', async () => {
      mockPrismaService.menuItem.findUnique.mockResolvedValue(null);

      await expect(service.deleteMenuItem('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getMenuItemsByCategory', () => {
    it('should return menu items for a specific category', async () => {
      const mockMenuItems = [
        { id: '1', name: 'Item 1', category: 'Main Course' },
        { id: '2', name: 'Item 2', category: 'Main Course' },
      ];

      mockPrismaService.menuItem.findMany.mockResolvedValue(mockMenuItems);

      const result = await service.getMenuItemsByCategory('Main Course');
      expect(result).toEqual(mockMenuItems);
      expect(mockPrismaService.menuItem.findMany).toHaveBeenCalledWith({
        where: {
          category: 'Main Course',
          isAvailable: true,
        },
      });
    });
  });
});
