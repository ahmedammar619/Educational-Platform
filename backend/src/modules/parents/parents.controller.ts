import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ParentsService } from './parents.service';
import { CreateParentDto } from './dto/create-parent.dto';
import { UpdateParentDto } from './dto/update-parent.dto';
import { AddChildDto } from './dto/add-child.dto';
import { CreateChildAccountDto } from './dto/create-child-account.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ForbiddenException } from '@nestjs/common';

@ApiTags('Parents')
@Controller('parents')
@ApiBearerAuth('JWT-auth')
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new parent account (Public)' })
  @ApiBody({ type: CreateParentDto })
  @ApiResponse({
    status: 201,
    description: 'Parent created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Parent with this email already exists',
  })
  async createParent(@Body() createParentDto: CreateParentDto) {
    return this.parentsService.createParent(createParentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get all parents (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Parents retrieved successfully',
  })
  async findAll() {
    const parents = await this.parentsService.findAll();
    return { parents };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get parent by ID (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Parent retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent not found',
  })
  async findOne(@Param('id') id: string) {
    const parent = await this.parentsService.findOne(id);
    return { parent };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update parent information (Protected)' })
  @ApiBody({ type: UpdateParentDto })
  @ApiResponse({
    status: 200,
    description: 'Parent updated successfully',
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
    status: 404,
    description: 'Parent not found',
  })
  async updateParent(
    @Param('id') id: string,
    @Body() updateParentDto: UpdateParentDto,
    @CurrentUser() currentUser: any
  ) {
    // Allow parents to update their own profile or admins to update any profile
    if (currentUser.sub !== id && currentUser.role !== Role.Admin) {
      throw new ForbiddenException('You do not have permission to update this parent');
    }
    return this.parentsService.updateParent(id, updateParentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a parent (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Parent deleted successfully',
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
    description: 'Parent not found',
  })
  async deleteParent(@Param('id') id: string) {
    return this.parentsService.deleteParent(id);
  }

  @Post(':id/children')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Add a child to parent (Protected)' })
  @ApiBody({ type: AddChildDto })
  @ApiResponse({
    status: 200,
    description: 'Child added successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent not found',
  })
  async addChild(
    @Param('id') id: string,
    @Body() addChildDto: AddChildDto,
    @CurrentUser() currentUser: any
  ) {
    // Allow parents to add children to their own account or admins
    if (currentUser.sub !== id && currentUser.role !== Role.Admin) {
      throw new ForbiddenException('You do not have permission to modify this parent');
    }
    return this.parentsService.addChild(id, addChildDto);
  }

  @Delete(':id/children/:studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Remove a child from parent (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Child removed successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent not found',
  })
  async removeChild(
    @Param('id') id: string,
    @Param('studentId') studentId: string,
    @CurrentUser() currentUser: any
  ) {
    // Allow parents to remove children from their own account or admins
    if (currentUser.sub !== id && currentUser.role !== Role.Admin) {
      throw new ForbiddenException('You do not have permission to modify this parent');
    }
    return this.parentsService.removeChild(id, studentId);
  }

  @Get(':id/children')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get parent children (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Children retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent not found',
  })
  async getChildren(
    @Param('id') id: string,
    @CurrentUser() currentUser: any
  ) {
    // Allow parents to view their own children or admins
    if (currentUser.sub !== id && currentUser.role !== Role.Admin) {
      throw new ForbiddenException('You do not have permission to view this parent');
    }
    const children = await this.parentsService.getChildren(id);
    return { children };
  }

  @Post(':id/create-child-account')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Parent)
  @ApiOperation({ summary: 'Create child account (Parent only)' })
  @ApiBody({ type: CreateChildAccountDto })
  @ApiResponse({
    status: 201,
    description: 'Child account created successfully',
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
    description: 'Forbidden - Parent privileges required',
  })
  @ApiResponse({
    status: 404,
    description: 'Parent not found',
  })
  async createChildAccount(
    @Param('id') id: string,
    @Body() createChildAccountDto: CreateChildAccountDto,
    @CurrentUser() currentUser: any
  ) {
    // Allow parents to create child accounts for themselves only
    if (currentUser.sub !== id) {
      throw new ForbiddenException('You can only create child accounts for your own account');
    }
    return this.parentsService.createChildAccount(id, createChildAccountDto);
  }
}
