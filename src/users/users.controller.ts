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
    UploadedFile } from '@nestjs/common';
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
    ApiTags 
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
    
    @Get()
    // @Roles(Role.ADMIN, Role.PROPIETARIO)
    getUsers(@Query('companyId') companyId?: string) {
        return this.usersService.getUsers(companyId);
    }

    @Get(':id')
    // @Roles(Role.ADMIN, Role.PROPIETARIO, Role.EMPLEADO)
    getUser(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.getUserById(id);
    }

    @Patch(':id')
    // @Roles(Role.ADMIN, Role.PROPIETARIO)
    updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.updateUser(id, dto);
    }

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

    @Delete(':id')
    // @Roles(Role.PROPIETARIO)
    deleteUser(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.deleteUser(id);
    }

    @Get(':id/companies')
    // @Roles(Role.ADMIN, Role.PROPIETARIO, Role.EMPLEADO)
    getUserCompanies(@Param('id', ParseUUIDPipe) id: string) {
        return this.usersService.getUserCompanies(id);
    }

    @Post(':id/companies/:companyId/role')
    // @Roles(Role.PROPIETARIO)
    changeRole(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('companyId', ParseUUIDPipe) companyId: string,
        @Body() dto: ChangeRoleDto,
    ) {
        // En la práctica, extraer rol del usuario logueado via JWT
        const currentUserRole = Role.PROPIETARIO; 
        return this.usersService.changeRole(id, companyId, dto, currentUserRole);
    }
}

