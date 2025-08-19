import {
  Body,
  Controller,
  Post,
  Patch,
  Get,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ParentsService } from './parents.service';
import { ParentSignupDto } from './dto/parent-signup.dto';
import { AddChildDto } from './dto/add-child.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Query } from '@nestjs/common';

@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  // 👤 Signup for parents
  @Post('signup')
  async signup(@Body() dto: ParentSignupDto) {
    return this.parentsService.signupParent(dto);
  }

  // 👨‍👦 Parent adds child (must be logged in as parent)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @Post('children')
  async addChild(@Request() req, @Body() dto: AddChildDto) {
    return this.parentsService.addChild(req.user.id, dto);
  }

  // 💳 Update payment info for a parent-child relation
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @Patch('children/:parentRecordId/payment')
  async updatePayment(
    @Request() req,
    @Param('parentRecordId') parentRecordId: number,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.parentsService.updatePayment(req.user.id, +parentRecordId, dto);
  }

  // 📋 Get all children of the logged-in parent
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('my-children')
  async getMyChildren(@Request() req) {
    return this.parentsService.getMyChildren(req.user.id);
  }

  // 📊 Parent views child's attendance
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('children/:childId/attendance')
  async getChildAttendance(
    @Request() req,
    @Param('childId') childId: number,
  ) {
    return this.parentsService.getChildAttendance(req.user.id, +childId);
  }

  // 📝 Parent views child's grades
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('children/:childId/grades')
  async getChildGrades(
    @Request() req,
    @Param('childId') childId: number,
    @Query('courseId') courseId?: number,
  ) {
    return this.parentsService.getChildGrades(req.user.id, +childId, { courseId });
  }
}
