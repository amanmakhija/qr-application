import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [StaffService, PrismaService],
  controllers: [StaffController],
  exports: [StaffService],
})
export class StaffModule {}
