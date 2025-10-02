import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  Request,
  // UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ChangeRoleDto } from './dto/changeRole.dto';
import { EditUserDto } from './dto/editUser.dto';
import { AdminResetPasswordDto } from './dto/resetPassword.dto';
//import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
//import { RolesGuard } from 'src/auth/guards/roles.guard';
//import { Roles } from 'src/auth/guards/roles.decorator';
import {
  ApiBearerAuth,
  //ApiBody,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { FilesService } from 'src/files/files.service';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors';

// Interfaz para el Request con usuario autenticado
interface RequestWithUser extends ExpressRequest {
  user?: {
    sub: string;
    email: string;
    role?: string;
    adminRole?: string;
    iat?: number;
    exp?: number;
  };
}

@ApiTags('Users')
@Controller('users')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  @ApiOperation({ summary: 'Get all active users' })
  @Get()
  // @Roles(Role.ADMIN, Role.OWNER)
  getUsers(@Query('companyId') companyId?: string) {
    return this.usersService.getActiveUsers(companyId);
  }

  @ApiOperation({ summary: 'Get all users (active and inactive) — SUPERADMIN only' })
  @Get('all')
  // @Roles(Role.SUPERADMIN)
  getAllUsers(@Query('companyId') companyId?: string) {
    return this.usersService.getAllUsers(companyId);
  }

  @ApiOperation({ summary: 'Create new user from admin panel' })
  @Post()
  // @Roles(Role.SUPER_ADMIN)
  async createUser(@Request() req: RequestWithUser, @Body() dto: any) {
    // Obtener el rol del admin actual desde el token JWT
    // Si no hay usuario autenticado, usar SUPER_ADMIN por defecto para testing
    const currentUserAdminRole = req.user?.adminRole || 'SUPER_ADMIN';
    return this.usersService.createUser(dto, currentUserAdminRole);
  }

  @ApiOperation({ summary: 'Get all deleted users for admin panel' })
  @Get('deleted')
  // @Roles(Role.SUPER_ADMIN)
  getDeletedUsers() {
    return this.usersService.getDeletedUsers();
  }

  @ApiOperation({ summary: 'Get all users with admin information for admin panel' })
  @Get('admin/list')
  // @Roles(Role.SUPER_ADMIN)
  getUsersForAdmin() {
    return this.usersService.getUsersForAdmin();
  }

  @ApiOperation({ summary: 'Get all clients (non-admin users) with their companies' })
  @Get('clients')
  // @Roles(Role.SUPER_ADMIN)
  getAllClients() {
    return this.usersService.getAllClients();
  }

  @ApiOperation({ summary: 'Get all deleted clients for admin panel' })
  @Get('clients/deleted')
  // @Roles(Role.SUPER_ADMIN)
  getDeletedClients() {
    return this.usersService.getDeletedClients();
  }

  @ApiOperation({ summary: 'Create new client with company' })
  @Post('clients')
  // @Roles(Role.SUPER_ADMIN)
  createClient(@Body() dto: any) {
    return this.usersService.createClient(dto);
  }

  @ApiOperation({ summary: 'Get user info passing user id as a parameter' })
  @Get(':id')
  // @Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE)
  getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserById(id);
  }

  @ApiOperation({
    summary: 
      'Update user name, email or avatar info passing user id as a parameter',
  })
  @Patch(':id')
  // @Roles(Role.ADMIN, Role.OWNER)
  updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(id, dto);
  }

  @ApiOperation({ summary: 'Add avatar passing user id as a parameter' })
  @ApiBearerAuth()
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 200_000 }),
          new FileTypeValidator({ fileType: 'image/(jpeg|png|webp)' }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const result = await this.filesService.uploadUserAvatar(id, file);
    return {
      message: 'Avatar actualizado correctamente',
      ...result,
    };
  }

  @ApiOperation({ summary: 'Get companies associated with a user' })
  @Get(':id/companies')
  // @Roles(Role.ADMIN, Role.OWNER, Role.EMPLOYEE)
  getUserCompanies(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.getUserCompanies(id);
  }

  @ApiOperation({ summary: 'Change user role in a company' })
  @Post(':id/companies/:companyId/role')
  // @Roles(Role.OWNER)
  changeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() dto: ChangeRoleDto,
  ) {
    // En la práctica, extraer rol del usuario logueado via JWT
    const currentUserRole = Role.OWNER;
    return this.usersService.changeRole(id, companyId, dto, currentUserRole);
  }

  @ApiOperation({ summary: 'Edit user information and admin status' })
  @Patch(':id/edit')
  // @Roles(Role.SUPER_ADMIN)
  editUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: EditUserDto,
  ) {
    return this.usersService.editUser(id, dto);
  }

  @ApiOperation({ summary: 'Reset user password to temporary password' })
  @Post(':id/reset-password')
  // @Roles(Role.SUPER_ADMIN)
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, dto);
  }

  @ApiOperation({ summary: 'Soft delete user - marks as deleted without removing data' })
  @Delete(':id')
  // @Roles(Role.SUPER_ADMIN)
  softDeleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.softDeleteUser(id);
  }

  @ApiOperation({ summary: 'Restore soft deleted user' })
  @Post(':id/restore')
  // @Roles(Role.SUPER_ADMIN)
  restoreUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.restoreUser(id);
  }

}

