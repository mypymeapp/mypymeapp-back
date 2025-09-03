/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
    Controller,
    Post,
    Body,
    Req,
    UseGuards,
    Get,
    Put,
    Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshDto } from './dto/refresh.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard'; // Importación de la guarda JWT
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'; // Importación de la guarda JWT Refresh
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiParam,
} from '@nestjs/swagger'; // Decoradores de Swagger

// Decorador para agrupar las rutas en la documentación de Swagger
@ApiTags('auth')
// Decorador para definir el controlador y su ruta base
@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    // ------------------------------------------------------------------------------------------------
    // Rutas de Autenticación
    // ------------------------------------------------------------------------------------------------

    // Ruta: POST /auth/register
    // Crear un nuevo usuario
    @Post('register')
    @ApiOperation({ summary: 'Registra un nuevo usuario.' }) // Descripción de la operación
    @ApiBody({ type: RegisterDto }) // Define el cuerpo de la solicitud para Swagger
    @ApiResponse({ status: 201, description: 'Usuario creado exitosamente.' })
    @ApiResponse({
        status: 400,
        description: 'El email ya está registrado.',
    })
    register(@Body() dto: RegisterDto) {
        // Llama al servicio para manejar la lógica de negocio
        // No se requiere guarda ya que es una ruta pública
        return this.auth.register(dto);
    }

    // Ruta: POST /auth/login
    // Login con email y contraseña
    @Post('login')
    @ApiOperation({ summary: 'Inicia sesión con email y contraseña.' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({
        status: 200,
        description: 'Login exitoso, devuelve accessToken y refreshToken.',
    })
    @ApiResponse({
        status: 401,
        description: 'Credenciales inválidas.',
    })
    login(@Body() dto: LoginDto) {
        // Llama al servicio para validar las credenciales y generar tokens
        // No se requiere guarda ya que es una ruta pública
        return this.auth.login(dto);
    }

    // Ruta: POST /auth/refresh
    // Renovar el accessToken usando un refreshToken válido
    @Post('refresh')
    @UseGuards(JwtRefreshGuard) // Aplica la guarda para verificar el refreshToken
    @ApiOperation({
        summary: 'Renueva el access token usando un refresh token válido.',
    })
    @ApiBearerAuth('jwt-refresh') // Define el tipo de autenticación para Swagger
    @ApiBody({ type: RefreshDto })
    @ApiResponse({
        status: 200,
        description: 'Tokens renovados exitosamente.',
    })
    @ApiResponse({
        status: 401,
        description: 'Refresh token inválido o expirado.',
    })
    refresh(@Req() req: any, @Body() dto: RefreshDto) {
        // req.user es poblado por la JwtRefreshGuard con los datos del payload del token
        const { userId, sessionId } = req.user;
        const presented =
            dto.refreshToken ||
            req.headers['x-refresh-token'] ||
            req.headers['authorization']?.replace('Bearer ', '');
        // El servicio usa userId y sessionId para buscar la sesión y rotar el token
        return this.auth.refresh(userId, sessionId, presented);
    }

    // Ruta: POST /auth/logout
    // Cierra una sesión específica
    @Post('logout')
    @UseGuards(JwtRefreshGuard) // Usa la guarda de refresh para invalidar una sesión específica
    @ApiOperation({ summary: 'Cierra la sesión actual, invalidando el refresh token.' })
    @ApiBearerAuth('jwt-refresh')
    @ApiResponse({
        status: 200,
        description: 'Logout exitoso de la sesión actual.',
    })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    logout(@Req() req: any) {
        // La guarda de refresh valida el token y extrae los datos de la sesión
        const { userId, sessionId } = req.user;
        // El servicio se encarga de eliminar la sesión de la base de datos
        return this.auth.logout(userId, sessionId);
    }

    // Ruta: GET /auth/logout
    // Cierra todas las sesiones del usuario (diferente a la anterior)
    @Get('logout')
    @UseGuards(JwtAuthGuard) // Usa la guarda de acceso para obtener el userId
    @ApiOperation({ summary: 'Cierra todas las sesiones del usuario.' })
    @ApiBearerAuth('jwt')
    @ApiResponse({
        status: 200,
        description: 'Logout exitoso de todas las sesiones.',
    })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    logoutGet(@Req() req: any) {
        // La guarda de acceso valida el token y extrae el userId
        return this.auth.logoutAll(req.user?.userId);
    }

    // Ruta: GET /auth/me
    // Obtener perfil del usuario autenticado
    @Get('me')
    @UseGuards(JwtAuthGuard) // Aplica la guarda para proteger la ruta
    @ApiOperation({ summary: 'Obtiene el perfil del usuario autenticado.' })
    @ApiBearerAuth('jwt') // Indica que esta ruta requiere un token de acceso JWT
    @ApiResponse({
        status: 200,
        description: 'Perfil del usuario.',
    })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    me(@Req() req: any) {
        // JwtAuthGuard adjunta el objeto de usuario al request
        // Se usa el userId para buscar el perfil en la DB
        return this.auth.me(req.user.userId);
    }

    // Ruta: PUT /auth/profile
    // Actualizar el perfil del usuario
    @Put('profile')
    @UseGuards(JwtAuthGuard) // La ruta está protegida por la guarda de acceso
    @ApiOperation({ summary: 'Actualiza el perfil del usuario autenticado.' })
    @ApiBearerAuth('jwt')
    @ApiBody({ type: UpdateProfileDto })
    @ApiResponse({
        status: 200,
        description: 'Perfil actualizado exitosamente.',
    })
    @ApiResponse({ status: 401, description: 'No autorizado.' })
    updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
        // El servicio usa el userId del request y el DTO para actualizar el perfil
        return this.auth.updateProfile(req.user.userId, dto);
    }

    // ------------------------------------------------------------------------------------------------
    // Rutas de Recuperación y Verificación
    // ------------------------------------------------------------------------------------------------

    // Ruta: POST /auth/forgot-password
    // Solicitar recuperación de contraseña (envía un email)
    @Post('forgot-password')
    @ApiOperation({
        summary: 'Solicita un enlace de recuperación de contraseña por email.',
    })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiResponse({
        status: 200,
        description:
            'Enlace de recuperación enviado (no revela si el email existe).',
    })
    forgotPassword(@Body() dto: ForgotPasswordDto) {
        // No se requiere autenticación, ya que es para usuarios sin sesión
        return this.auth.forgotPassword(dto.email);
    }

    // Ruta: POST /auth/reset-password
    // Restablecer la contraseña con el token
    @Post('reset-password')
    @ApiOperation({ summary: 'Restablece la contraseña usando un token válido.' })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({
        status: 200,
        description: 'Contraseña restablecida exitosamente.',
    })
    @ApiResponse({
        status: 401,
        description: 'Token inválido o expirado.',
    })
    resetPassword(@Body() dto: ResetPasswordDto) {
        // Se valida el token que viene en el cuerpo de la solicitud
        return this.auth.resetPassword(dto.token, dto.newPassword);
    }

    // Ruta: POST /auth/verify-email
    // Confirmar una cuenta nueva con un token
    @Post('verify-email')
    @ApiOperation({ summary: 'Verifica el email del usuario usando un token.' })
    @ApiBody({ type: VerifyEmailDto })
    @ApiResponse({
        status: 200,
        description: 'Email verificado exitosamente.',
    })
    @ApiResponse({
        status: 401,
        description: 'Token inválido o expirado.',
    })
    verifyEmail(@Body() dto: VerifyEmailDto) {
        // Se valida el token que viene en el cuerpo de la solicitud
        return this.auth.verifyEmail(dto.token);
    }

    // ------------------------------------------------------------------------------------------------
    // Rutas de OAuth
    // ------------------------------------------------------------------------------------------------

    // Ruta: POST /auth/login/google
    // Login con token de Google
    @Post('login/google')
    @ApiOperation({ summary: 'Inicia sesión con un token de Google.' })
    @ApiBody({ schema: { type: 'object', properties: { token: { type: 'string' } } } })
    @ApiResponse({
        status: 200,
        description: 'Login con Google exitoso, devuelve tokens.',
    })
    @ApiResponse({
        status: 401,
        description: 'Token de Google inválido.',
    })
    loginGoogle(@Body() body: { token: string }) {
        // En un entorno real, este token se validaría con la API de Google
        return this.auth.loginWithGoogle(body.token);
    }

    // Ruta: GET /auth/oauth/:provider
    // Redirección para iniciar el flujo OAuth
    @Get('oauth/:provider')
    @ApiOperation({
        summary: 'Redirección para el flujo de autenticación OAuth.',
    })
    @ApiParam({
        name: 'provider',
        description: 'El proveedor de OAuth (ej: google, github).',
        required: true,
        example: 'google',
    })
    @ApiResponse({
        status: 200,
        description: 'Devuelve información sobre la redirección OAuth.',
    })
    oauthRedirect(@Param('provider') provider: string) {
        // Esta ruta simula el inicio del flujo de autenticación OAuth
        return this.auth.oauthLogin(provider, 'CODE_FROM_CLIENT');
    }
}