import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    order: {
      findMany: jest.fn(),
    },
    qRCodeScan: {
      findMany: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDailyOrders', () => {
    it('should return daily orders within UTC time range', async () => {
      const mockDate = new Date('2024-01-15T12:00:00Z');
      const expectedStartDate = new Date('2024-01-15T00:00:00.000Z');
      const expectedEndDate = new Date('2024-01-15T23:59:59.999Z');

      const mockOrders = [
        {
          id: '1',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          items: [],
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getDailyOrders(mockDate);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expectedStartDate,
            lte: expectedEndDate,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      expect(result).toEqual(mockOrders);
    });

    it('should handle empty results', async () => {
      const mockDate = new Date('2024-01-15');
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getDailyOrders(mockDate);
      expect(result).toEqual([]);
    });
  });

  describe('getMonthlyOrders', () => {
    it('should return orders for the specified month', async () => {
      const year = 2024;
      const month = 1;
      const expectedStartDate = new Date('2024-01-01T00:00:00.000Z');
      const expectedEndDate = new Date('2024-01-31T23:59:59.999Z');

      const mockOrders = [
        {
          id: '1',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          items: [],
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getMonthlyOrders(year, month);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expectedStartDate,
            lte: expectedEndDate,
          },
        },
        include: {
          items: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      expect(result).toEqual(mockOrders);
    });

    it('should handle month with different number of days', async () => {
      const result = await service.getMonthlyOrders(2024, 2); // February in leap year
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: new Date('2024-02-01T00:00:00.000Z'),
              lte: new Date('2024-02-29T23:59:59.999Z'),
            },
          },
        }),
      );
    });
  });

  describe('getQRCodeScans', () => {
    it('should return scans within the date range', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');
      const expectedStartDate = new Date('2024-01-15T00:00:00.000Z');
      const expectedEndDate = new Date('2024-01-16T23:59:59.999Z');

      const mockScans = [
        {
          id: '1',
          scannedAt: new Date('2024-01-15T14:30:00Z'),
          tableNumber: 'A1',
        },
      ];

      mockPrismaService.qRCodeScan.findMany.mockResolvedValue(mockScans);

      const result = await service.getQRCodeScans(startDate, endDate);

      expect(prisma.qRCodeScan.findMany).toHaveBeenCalledWith({
        where: {
          scannedAt: {
            gte: expectedStartDate,
            lte: expectedEndDate,
          },
        },
        orderBy: {
          scannedAt: 'desc',
        },
      });
      expect(result).toEqual(mockScans);
    });

    it('should handle empty results', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');
      mockPrismaService.qRCodeScan.findMany.mockResolvedValue([]);

      const result = await service.getQRCodeScans(startDate, endDate);
      expect(result).toEqual([]);
    });
  });

  describe('getPopularItems', () => {
    it('should aggregate and sort items by quantity', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');

      const mockOrderItems = [
        {
          menuItem: { id: '1', name: 'Item 1', price: 10 },
          quantity: 3,
          price: 10,
        },
        {
          menuItem: { id: '1', name: 'Item 1', price: 10 },
          quantity: 2,
          price: 10,
        },
        {
          menuItem: { id: '2', name: 'Item 2', price: 15 },
          quantity: 1,
          price: 15,
        },
      ];

      mockPrismaService.orderItem.findMany.mockResolvedValue(mockOrderItems);

      const result = await service.getPopularItems(startDate, endDate);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        menuItem: { id: '1', name: 'Item 1', price: 10 },
        totalQuantity: 5,
        totalRevenue: 50,
      });
      expect(result[1]).toEqual({
        menuItem: { id: '2', name: 'Item 2', price: 15 },
        totalQuantity: 1,
        totalRevenue: 15,
      });
    });

    it('should handle empty results', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');
      mockPrismaService.orderItem.findMany.mockResolvedValue([]);

      const result = await service.getPopularItems(startDate, endDate);
      expect(result).toEqual([]);
    });
  });

  describe('getRevenueStats', () => {
    it('should calculate revenue statistics correctly', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');

      const mockOrders = [
        { finalAmount: 100 },
        { finalAmount: 200 },
        { finalAmount: 300 },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getRevenueStats(startDate, endDate);

      expect(result).toEqual({
        totalOrders: 3,
        totalRevenue: 600,
        averageOrderValue: 200,
      });
    });

    it('should handle empty orders', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getRevenueStats(startDate, endDate);

      expect(result).toEqual({
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
      });
    });

    it('should exclude cancelled orders', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');

      const result = await service.getRevenueStats(startDate, endDate);

      expect(prisma.order.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
          status: {
            not: 'CANCELLED',
          },
        },
      });
    });
  });
});
