import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  async getAllMenuItems() {
    return this.prisma.menuItem.findMany({
      where: { isAvailable: true },
    });
  }

  async getMenuItemById(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return menuItem;
  }

  async createMenuItem(data: {
    name: string;
    description?: string;
    price: number;
    category: string;
    image?: string;
  }) {
    return this.prisma.menuItem.create({
      data,
    });
  }

  async updateMenuItem(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      category?: string;
      image?: string;
      isAvailable?: boolean;
    },
  ) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.update({
      where: { id },
      data,
    });
  }

  async deleteMenuItem(id: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id },
    });

    if (!menuItem) {
      throw new NotFoundException('Menu item not found');
    }

    return this.prisma.menuItem.delete({
      where: { id },
    });
  }

  async getMenuItemsByCategory(category: string) {
    return this.prisma.menuItem.findMany({
      where: {
        category,
        isAvailable: true,
      },
    });
  }
}
