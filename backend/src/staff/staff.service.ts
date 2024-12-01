import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async checkIn(staffId: string) {
    const existingCheckIn = await this.prisma.staffAttendance.findFirst({
      where: {
        staffId,
        checkOut: null,
      },
    });

    if (existingCheckIn) {
      throw new Error('Staff member already checked in');
    }

    return this.prisma.staffAttendance.create({
      data: {
        staffId,
        checkIn: new Date(),
      },
    });
  }

  async checkOut(staffId: string) {
    const attendance = await this.prisma.staffAttendance.findFirst({
      where: {
        staffId,
        checkOut: null,
      },
    });

    if (!attendance) {
      throw new NotFoundException('No active check-in found');
    }

    return this.prisma.staffAttendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
      },
    });
  }

  async getStaffAttendance(staffId: string, startDate: Date, endDate: Date) {
    return this.prisma.staffAttendance.findMany({
      where: {
        staffId,
        checkIn: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        checkIn: 'desc',
      },
    });
  }

  async getActiveStaff() {
    return this.prisma.staffAttendance.findMany({
      where: {
        checkOut: null,
      },
      orderBy: {
        checkIn: 'desc',
      },
    });
  }
}
