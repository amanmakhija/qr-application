import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ItemStats {
  [key: string]: {
    menuItem: any;
    totalQuantity: number;
    totalRevenue: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDailyOrders(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  }

  async getMonthlyOrders(year: number, month: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  }

  async getQRCodeScans(startDate: Date, endDate: Date) {
    return this.prisma.qRCodeScan.findMany({
      where: {
        scannedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        scannedAt: 'desc',
      },
    });
  }

  async getPopularItems(startDate: Date, endDate: Date) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        menuItem: true,
      },
    });

    const itemStats = orderItems.reduce((acc: ItemStats, item) => {
      const key = item.menuItem.id;
      if (!acc[key]) {
        acc[key] = {
          menuItem: item.menuItem,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      acc[key].totalQuantity += item.quantity;
      acc[key].totalRevenue += item.price * item.quantity;
      return acc;
    }, {} as ItemStats);

    return Object.values(itemStats).sort(
      (a: { totalQuantity: number }, b: { totalQuantity: number }) =>
        b.totalQuantity - a.totalQuantity,
    );
  }

  async getRevenueStats(startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          not: 'CANCELLED',
        },
      },
    });

    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.finalAmount, 0),
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, order) => sum + order.finalAmount, 0) /
            orders.length
          : 0,
    };
  }
}
