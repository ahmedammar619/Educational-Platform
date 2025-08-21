import {
  Body,
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ParentsService } from './parents.service';
import { ParentSignupDto } from './dto/parent-signup.dto';
import { AddChildDto } from './dto/add-child.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @Delete('children/:childId')
  async removeChild(@Request() req, @Param('childId') childId: number) {
    return this.parentsService.removeChild(req.user.id, +childId);
  }
}
