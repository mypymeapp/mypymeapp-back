import {
  Injectable,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SignupDto } from 'src/auth/dto/signup.dto';
import { SigninDto } from 'src/auth/dto/signin.dto';
import { PrismaService } from 'prisma/prisma.service';
import { AuthLib } from './utils/auth.lib';
import { Response } from 'express';
import { CreateGoogleDto } from './dto/google.dto';
import { EmailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private authLib: AuthLib,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string) {
    const result = await this.authLib.validateUser({ email, password });
    if (!result || !result.user) return null;

    const compare = await this.authLib.comparePassword(
      password,
      result.user.passwordHash,
    );
    if (!compare) return null;

    const { passwordHash, ...user } = result.user;
    return user;
  }

  async signIn(dto: SigninDto, res: Response) {
    const result = await this.authLib.validateUser(dto);
    if (!result.user) throw new ForbiddenException('Invalid credentials');

    const compare = await this.authLib.comparePassword(
      dto.password,
      result.user.passwordHash,
    );
    if (!compare) throw new ForbiddenException('Invalid credentials');

    try {
      const token = await this.authLib.generateToken(result.user);
      this.authLib.addCookie(res, token);
      return {
        token: token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          company: {
            id: result.company?.id,
            name: result.company?.name,
          },
        },
      };
    } catch {
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async signInWithGoogle(dto: CreateGoogleDto, res: Response) {
    const result = await this.authLib.validateUserGoogle(dto);
    if (result.user) {
      const token = await this.authLib.generateToken(result.user);
      this.authLib.addCookie(res, token);
      return {
        token: token,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          company: {
            id: result.company?.id,
            name: result.company?.name,
          },
        },
      };
    }
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
          company: {},
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
    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }

    try {
      // Hashear la contraseña
      const passwordHash = await this.authLib.hashPassword(dto.password);

      // Crear el usuario en la base de datos y guardar la referencia
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          avatarUrl: dto.avatarUrl,
        },
      });

      // Enviar correo de bienvenida (no bloquea el registro si falla)
      // try {
      //   await this.emailService.sendEmail(
      //     user.email,
      //     '¡Bienvenido a MyPyme!',
      //     `<h1>Hola ${user.name} 👋</h1>
      //     <p>Gracias por registrarte en MyPyme. ¡Esperamos que disfrutes nuestra plataforma!</p>`,
      //   );
      // } catch (err) {
      //   console.error('Error enviando correo de bienvenida:', err);
      // }

      try {
        await this.emailService.sendWelcomeEmail(user.name, user.email);
      } catch (err) {
        console.error('Error enviando correo de bienvenida:', err);
      }

      // Retornar respuesta al cliente
      return {
        status: 'success',
        message: 'User signed up successfully',
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async signOut(res: Response) {
    res.clearCookie('auth-token');
    return {
      status: 'success',
      message: 'User signed out successfully',
    };
  }
}

