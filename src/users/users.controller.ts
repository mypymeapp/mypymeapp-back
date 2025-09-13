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
  // UseGuards,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';
import { ChangeRoleDto } from './dto/changeRole.dto';
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

@ApiTags('Users')
@Controller('users')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly filesService: FilesService,
  ) {}

  @ApiOperation({ summary: 'Get all users' })
  @Get()
  // @Roles(Role.ADMIN, Role.OWNER)
  getUsers(@Query('companyId') companyId?: string) {
    return this.usersService.getUsers(companyId);
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
  @ApiOperation({ summary: 'Delete a user by passing the id as a parameter' })
  @Delete(':id')
  // @Roles(Role.OWNER)
  deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deleteUser(id);
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
}

