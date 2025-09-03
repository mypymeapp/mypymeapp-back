/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Injectable,
    BadRequestException,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { UpdateProfileDto } from './dto/update-profile.dto';


// Este es el servicio que contiene toda la lógica de negocio para la autenticación.
// Se inyecta en el controlador para manejar las peticiones HTTP.
@Injectable()
export class AuthService {
    // La sal se usa para hashear contraseñas, se obtiene de las variables de entorno.
    private saltRounds = Number(process.env.AUTH_SALT_ROUNDS || 10);

    // Inyección de dependencias de Prisma y JwtService.
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) {}

    // ================================================================================================
    // Helpers internos para JWT
    // ================================================================================================

    /** * @description Genera un accessToken de corta duración (ej: 15m) que se usará para
     * proteger la mayoría de las rutas de la API. Este token se verifica con la
     * `JwtAuthGuard`.
     */
    private signToken(user: { id: string; email: string }) {
        // Usa el `JwtService` para firmar el token con el `subject` (userId) y el `email`.
        // La expiración y el secreto se configuran en el módulo JWT.
        return this.jwt.sign(
            { email: user.email },
            {
                subject: user.id,
                secret: process.env.JWT_SECRET!, // El secreto para la firma del token
                expiresIn: process.env.JWT_EXPIRES_IN || '900s', // Tiempo de expiración del token
            },
        );
    }

    /** * @description Genera un refreshToken de larga duración (ej: 7d) ligado a una
     * `sessionId` en la base de datos. Se usa para renovar el `accessToken` y
     * se verifica con la `JwtRefreshGuard`.
     */
    private signRefreshToken(user: { id: string }, sessionId: string) {
        // El payload incluye el `sessionId` para poder identificar la sesión al refrescar.
        return this.jwt.sign(
            { sessionId },
            {
                subject: user.id,
                secret: process.env.JWT_REFRESH_SECRET!, // Secreto diferente para el refresh token
                expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d', // Tiempo de expiración más largo
            },
        );
    }

    // ================================================================================================
    // Lógica de Registro / Login
    // ================================================================================================

    /** * @description Registra un nuevo usuario.
     * @param dto Datos del usuario a registrar (email, name, password).
     * @returns Los datos del usuario creado.
     */
    async register(dto: RegisterDto) {
        // 1. Verificar si el email ya existe en la base de datos.
        const exists = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (exists) {
            throw new BadRequestException('Email ya registrado');
        }

        // 2. Hashear la contraseña antes de guardarla.
        const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

        // 3. Crear el nuevo registro en la tabla `User`.
        const user = await this.prisma.user.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash,
            },
            select: { id: true, name: true, email: true, createdAt: true },
        });

        return user;
    }

    /** * @description Inicia sesión del usuario con email y contraseña.
     * @param dto Datos de inicio de sesión (email, password).
     * @returns Los tokens (accessToken, refreshToken) y los datos del usuario.
     */
    async login(dto: LoginDto) {
        // 1. Buscar al usuario por email. Si no existe, lanza un error.
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // 2. Comparar la contraseña ingresada con el hash de la base de datos.
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        // 3. Crear una nueva sesión en la base de datos.
        // La sesión se usará para invalidar el refresh token y para rotación de tokens.
        const session = await this.prisma.session.create({
            data: {
                userId: user.id,
                refreshTokenHash: '', // Se actualizará más tarde con el hash del token
                userAgent: 'api', // Ejemplo de datos de sesión
                ip: 'local', // Ejemplo de datos de sesión
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expiración en 7 días
            },
        });

        // 4. Generar el accessToken y el refreshToken.
        const accessToken = this.signToken({
            id: user.id,
            email: user.email,
        });
        const refreshToken = this.signRefreshToken({ id: user.id }, session.id);

        // 5. Hashear y guardar el refresh token en la sesión.
        // Esto permite validar el refresh token sin tener que almacenarlo en texto plano.
        const hashedRefreshJwt = await bcrypt.hash(
            refreshToken,
            this.saltRounds,
        );
        await this.prisma.session.update({
            where: { id: session.id },
            data: { refreshTokenHash: hashedRefreshJwt },
        });

        // 6. Devolver los tokens y los datos del usuario.
        return {
            accessToken,
            refreshToken,
            user: { id: user.id, name: user.name, email: user.email },
        };
    }

    // ================================================================================================
    // Lógica de Refresh / Logout
    // ================================================================================================

    /** * @description Renueva el accessToken y el refreshToken (rotación de tokens).
     * @param userId ID del usuario.
     * @param sessionId ID de la sesión.
     * @param presentedRefreshJwt El refresh token enviado en la petición.
     * @returns El nuevo accessToken y refreshToken.
     */
    async refresh(userId: string, sessionId: string, presentedRefreshJwt: string) {
        // 1. Buscar la sesión por ID y verificar que pertenezca al usuario.
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.userId !== userId) {
            throw new UnauthorizedException('Sesión inválida');
        }

        // 2. Verificar si la sesión ha expirado. Si es así, la elimina.
        if (session.expiresAt < new Date()) {
            await this.prisma.session.delete({ where: { id: session.id } });
            throw new UnauthorizedException('Refresh expirado');
        }

        // 3. Comparar el token enviado con el hash guardado en la sesión.
        const ok = await bcrypt.compare(
            presentedRefreshJwt,
            session.refreshTokenHash,
        );
        if (!ok) {
            throw new UnauthorizedException('Refresh inválido');
        }

        // 4. Buscar el usuario.
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new UnauthorizedException('usuario no encontrado');
        }

        // 5. Generar nuevos tokens.
        const accessToken = this.signToken({
            id: user.id,
            email: user.email,
        });
        const newRefreshToken = this.signRefreshToken({ id: user.id }, session.id);

        // 6. Hashear y actualizar la sesión con el nuevo refresh token.
        const newHash = await bcrypt.hash(newRefreshToken, this.saltRounds);
        await this.prisma.session.update({
            where: { id: session.id },
            data: {
                refreshTokenHash: newHash,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });

        return { accessToken, refreshToken: newRefreshToken };
    }

    /** * @description Invalida una sesión específica.
     * @param userId ID del usuario.
     * @param sessionId ID de la sesión a invalidar.
     */
    async logout(userId: string, sessionId: string) {
        // Elimina el registro de la sesión de la base de datos.
        await this.prisma.session.deleteMany({
            where: { id: sessionId, userId },
        });
        return { ok: true };
    }

    /** * @description Invalida todas las sesiones de un usuario.
     * @param userId ID del usuario.
     */
    async logoutAll(userId: string) {
        // Elimina todos los registros de sesión asociados a un usuario.
        await this.prisma.session.deleteMany({ where: { userId } });
        return { ok: true };
    }

    // ================================================================================================
    // Lógica de Perfil
    // ================================================================================================

    /** * @description Obtiene los datos del perfil del usuario.
     * @param userId ID del usuario.
     * @returns Los datos del perfil.
     */
    async me(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                createdAt: true,
                isActive: true,
            },
        });
    }

    /** * @description Actualiza el perfil del usuario.
     * @param userId ID del usuario.
     * @param data Datos a actualizar.
     * @returns Los datos actualizados del perfil.
     */
    async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, name: true, email: true, avatarUrl: true },
        });
    }

    // ================================================================================================
    // Lógica de OAuth / Google (Simulada)
    // ================================================================================================

    /** * @description Lógica de inicio de sesión con Google.
     * @param googleToken El token de Google (simulado).
     * @returns Los tokens y el usuario.
     */
    async loginWithGoogle(googleToken: string) {
        // En una implementación real, se usaría un cliente de Google para validar
        // el token y obtener los datos del usuario.
        // Ejemplo simulado:
        const email = 'google-user@example.com';
        const name = 'Google User';

        let user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Si el usuario no existe, se crea uno nuevo.
            user = await this.prisma.user.create({
                data: { email, name, passwordHash: crypto.randomUUID() },
            });
        }

        // Se generan y devuelven los tokens.
        const accessToken = this.signToken({
            id: user.id,
            email: user.email,
        });
        const refreshToken = this.signRefreshToken(
            { id: user.id },
            crypto.randomUUID(),
        ); // Se usa un ID de sesión simulado

        return { accessToken, refreshToken, user };
    }

    /** * @description Lógica para la redirección OAuth (simulada).
     * @param provider El proveedor (ej: google, github).
     * @param code El código de autorización (simulado).
     */
    async oauthLogin(provider: string, code: string) {
        // En un caso real, se intercambiaría el `code` por un `access_token`
        // con el proveedor de OAuth.
        return { provider, code };
    }

    // ================================================================================================
    // Lógica de Forgot / Reset password
    // ================================================================================================

    /** * @description Inicia el proceso de recuperación de contraseña.
     * @param email El email del usuario.
     */
    async forgotPassword(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        // No se revela si el email existe por seguridad.
        if (!user) {
            return { ok: true };
        }

        // Se genera un token único y se guarda con la fecha de expiración.
        const token = crypto.randomUUID();
        await this.prisma.passwordReset.create({
            data: {
                userId: user.id,
                token,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Válido por 1 hora
            },
        });

        // Aquí iría la lógica para enviar el email con el enlace.
        console.log(`Enviar reset link con token: ${token}`);

        return { ok: true };
    }

    /** * @description Completa el proceso de restablecimiento de contraseña.
     * @param token El token de recuperación.
     * @param newPassword La nueva contraseña.
     */
    async resetPassword(token: string, newPassword: string) {
        // 1. Buscar el token de recuperación en la DB y verificar su validez y expiración.
        const reset = await this.prisma.passwordReset.findUnique({
            where: { token },
        });
        if (!reset || reset.expiresAt < new Date()) {
            throw new UnauthorizedException('Token inválido');
        }

        // 2. Hashear la nueva contraseña.
        const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

        // 3. Actualizar la contraseña del usuario.
        await this.prisma.user.update({
            where: { id: reset.userId },
            data: { passwordHash },
        });

        // 4. Eliminar el token de un solo uso de la base de datos.
        await this.prisma.passwordReset.delete({ where: { id: reset.id } });

        return { ok: true };
    }

    // ================================================================================================
    // Lógica de Verificación de Email
    // ================================================================================================

    /** * @description Verifica la cuenta de email del usuario.
     * @param token El token de verificación.
     */
    async verifyEmail(token: string) {
        // 1. Buscar el token de verificación en la DB y verificar su validez.
        const verification = await this.prisma.emailVerification.findUnique({
            where: { token },
        });
        if (!verification || verification.expiresAt < new Date()) {
            throw new UnauthorizedException('Token inválido');
        }

        // 2. Activar la cuenta del usuario (`isActive: true`).
        await this.prisma.user.update({
            where: { id: verification.userId },
            data: { isActive: true },
        });

        // 3. Eliminar el token de un solo uso.
        await this.prisma.emailVerification.delete({
            where: { id: verification.id },
        });

        return { ok: true };
    }
}