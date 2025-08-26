// src/modules/users/users.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UnauthorizedException, ForbiddenException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all users (Public - No Authorization Required)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'role', required: false, enum: ['admin', 'teacher', 'student', 'parent'], description: 'Filter by role' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    console.log('findAll endpoint hit - Public Access'); // DEBUG
    const users = await this.usersService.findAll();
    console.log('Users fetched from DB:', users); // DEBUG
    return { users };
  }

  @Get('role/:role')
  @Public()
  @ApiOperation({ summary: 'Get users by role (Public - No Authorization Required)' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async findByRole(@Param('role') role: Role) {
    const users = await this.usersService.findByRole(role);
    return { users };
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get user by ID (Public - No Authorization Required)' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return { user };
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new user (Public - No Authorization Required)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update user information (Protected)' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient privileges',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any
  ) {
    // Allow users to update their own profile or admins to update any profile
    if (currentUser.sub !== id && currentUser.role !== Role.Admin) {
      throw new ForbiddenException('You do not have permission to update this user');
    }
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privileges required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() currentUser: any
  ) {
    // Double-check admin role and prevent self-deletion
    if (currentUser.role !== Role.Admin) {
      throw new ForbiddenException('Only administrators can delete users');
    }
    if (currentUser.sub === id) {
      throw new ForbiddenException('Administrators cannot delete their own account');
    }
    return this.usersService.deleteUser(id);
  }
}
