import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { SignupDto } from 'src/auth/dto/signup.dto';
import { SigninDto } from 'src/auth/dto/signin.dto';
import { PrismaService } from 'prisma/prisma.service';
import { AuthLib } from './utils/auth.lib';
import { Response } from 'express';
import { CreateGoogleDto } from './dto/google.dto';
import { EmailService } from 'src/mail/mail.service';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private authLib: AuthLib,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const result = await this.authLib.validateUser({ email, password });
    if (!result.user || !result.user.isActive) return null;

    const compare = await this.authLib.comparePassword(
      password,
      result.user.passwordHash,
    );
    if (!compare) return null;

    const { passwordHash, ...user } = result.user;
    return user;
  }

  async signIn(dto: SigninDto, res: Response) {
    // Ahora result contendrá user, company y role
    const result = await this.authLib.validateUser(dto);

    // Verifica si el usuario existe antes de intentar comparar la contraseña
    if (!result.user) throw new ForbiddenException('Invalid credentials');

    const compare = await this.authLib.comparePassword(
      dto.password,
      result.user.passwordHash,
    );
    if (!compare) throw new ForbiddenException('Invalid credentials');

    try {
      const token = await this.authLib.generateToken(result.user);
      this.authLib.addCookie(res, token);

      // Obtener datos de admin si existe
      const adminData = await this.prisma.admin.findUnique({
        where: { userId: result.user.id },
      });

      return {
        token: token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          avatarUrl: result.user.avatarUrl,
          // Usa el encadenamiento opcional (?) para evitar errores
          role: result.role,
          company: {
            id: result.company?.id,
            name: result.company?.name,
            subscriptionStatus: result.company?.subscriptionStatus,
          },
          // Datos de admin
          isAdmin: !!adminData,
          adminRole: adminData?.role || null,
          adminDepartment: adminData?.department || null,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async signInWithGoogle(dto: CreateGoogleDto, res: Response) {
    const result = await this.authLib.validateUserGoogle(dto);
    // Caso: usuario ya existe
    if (result.user) {
      // Actualizar avatar si no existe
      if (!result.user.avatarUrl && dto.avatarUrl) {
        await this.prisma.user.update({
          where: { id: result.user.id },
          data: { avatarUrl: dto.avatarUrl },
        });
        result.user.avatarUrl = dto.avatarUrl; // actualizar localmente para la respuesta
      }

      const token = await this.authLib.generateToken(result.user);
      this.authLib.addCookie(res, token);

      // Obtener datos de admin si existe
      const adminData = await this.prisma.admin.findUnique({
        where: { userId: result.user.id },
      });

      return {
        token: token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          avatarUrl: result.user.avatarUrl,
          role: result.role,
          company: {
            id: result.company?.id,
            name: result.company?.name,
            subscriptionStatus: result.company?.subscriptionStatus,
          },
          // Datos de admin
          isAdmin: !!adminData,
          adminRole: adminData?.role || null,
          adminDepartment: adminData?.department || null,
        },
      };
    }

    // Caso: usuario NO existe
    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash: '',
          avatarUrl: dto.avatarUrl,
        },
      });

      try {
        await this.emailService.sendWelcomeEmail(user.name, user.email);
      } catch (err) {
        console.error('Error enviando correo de bienvenida Google:', err);
      }

      const token = await this.authLib.generateToken(user);
      this.authLib.addCookie(res, token);

      return {
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: 'EMPLOYEE', // rol por defecto para nuevos usuarios
          company: {
            id: null,
            name: null,
            subscriptionStatus: 'FREE',
          },
          // Datos de admin (nuevo usuario no es admin)
          isAdmin: false,
          adminRole: null,
          adminDepartment: null,
        },
      };
    } catch (error) {
      console.error('Error creating Google user:', error);
      throw new InternalServerErrorException(
        'Database connection error during Google user creation',
      );
    }
  }

  async signUp(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    const passwordHash = await this.authLib.hashPassword(dto.password);

    if (existingUser) {
      if (existingUser.isActive) {
        throw new ConflictException('Email already in use');
      }

      // Reactivar usuario
      const reactivatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          avatarUrl: dto.avatarUrl,
          isActive: true,
        },
      });

      try {
        await this.emailService.sendWelcomeEmail(
          reactivatedUser.name,
          reactivatedUser.email,
        );
      } catch (err) {
        console.error('Error enviando correo de bienvenida (reactivado):', err);
      }

      return {
        status: 'success',
        message: 'User reactivated successfully',
        userId: reactivatedUser.id,
      };
    }

    // 🆕 Crear usuario normal
    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        avatarUrl: dto.avatarUrl,
        isActive: true,
      },
    });

    try {
      await this.emailService.sendWelcomeEmail(
        newUser.name,
        newUser.email,
      );
    } catch (err) {
      console.error('Error enviando correo de bienvenida (nuevo):', err);
    }

    return {
      status: 'success',
      message: 'User signed up successfully',
      userId: newUser.id,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) return { message: 'If that email exists, we sent instructions' };

    // Generar token seguro
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // usear 1 hora

    await this.prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    await this.emailService.sendPasswordResetEmail(user.email, token);

    return { message: 'We sent instructions to your email account' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const record = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new ForbiddenException('Token inválido o expirado');
    }

    const newHash = await this.authLib.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash: newHash },
    });

    // Borrar el token para que no pueda reutilizarse
    await this.prisma.passwordReset.delete({ where: { id: record.id } });

    return { message: 'Password updated successfully' };
  }

  async signOut(res: Response) {
    res.clearCookie('auth-token');
    return {
      status: 'success',
      message: 'User signed out successfully',
    };
  }
}

