import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Staff check-in' })
  @ApiResponse({ status: 201, description: 'Staff checked in successfully' })
  async checkIn(@Request() req) {
    return this.staffService.checkIn(req.user.id);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Staff check-out' })
  @ApiResponse({ status: 200, description: 'Staff checked out successfully' })
  @ApiResponse({ status: 404, description: 'No active check-in found' })
  async checkOut(@Request() req) {
    return this.staffService.checkOut(req.user.id);
  }

  @Get('attendance')
  @ApiOperation({ summary: 'Get staff attendance records' })
  @ApiResponse({ status: 200, description: 'Return staff attendance records' })
  async getAttendance(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.staffService.getStaffAttendance(
      req.user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('active')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get currently active staff' })
  @ApiResponse({ status: 200, description: 'Return active staff members' })
  async getActiveStaff() {
    return this.staffService.getActiveStaff();
  }
}
