import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { ParentsService } from './parents.service';
import { ParentSignupDto } from './dto/parent-signup.dto';
import { AddChildDto } from './dto/add-child.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('parents')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  // 👤 Signup for parents
  @Post('signup')
  async signup(@Body() dto: ParentSignupDto) {
    return this.parentsService.signupParent(dto);
  }

  // 👨‍👦 Parent creates a new student account for their child
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @Post('children')
  async createChildAccount(@Request() req, @Body() dto: AddChildDto) {
    return this.parentsService.createChildAccount(req.user.id, dto);
  }

  // 📋 Get all children of the logged-in parent
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @Get('my-children')
  async getMyChildren(@Request() req) {
    return this.parentsService.getMyChildren(req.user.id);
  }

  // 🗑️ Remove child account
  @Delete('children/:childId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove child from parent' })
  @ApiResponse({
    status: 200,
    description: 'Child removed successfully',
  })
  async removeChild(@Req() req, @Param('childId') childId: string) {
    return this.parentsService.removeChild(req.user.id, childId);
  }

  // 📊 Get child progress
  @Get('children/:childId/progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @ApiOperation({ summary: 'Get child progress' })
  @ApiResponse({
    status: 200,
    description: 'Child progress retrieved successfully',
  })
  async getChildProgress(@Request() req, @Param('childId') childId: string) {
    return this.parentsService.getChildProgress(req.user.id, childId);
  }
}
