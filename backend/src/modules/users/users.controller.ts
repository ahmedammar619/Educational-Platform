// src/modules/users/users.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Users')
@Controller('users')
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
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get user by ID (Admin/Teacher access required)' })
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
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update user information (Admin access required)' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a user (Admin access required)' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Get(':id/relationships')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get user relationship details (Admin access required)' })
  @ApiResponse({
    status: 200,
    description: 'User relationship details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserRelationships(@Param('id') id: string) {
    return this.usersService.getUserRelationshipDetails(id);
  }
}
