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

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private authLib: AuthLib,
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
    if (!result || !result.user)
      throw new ForbiddenException('Invalid credentials');

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

  async signUp(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ForbiddenException('User already exists');
    }
    try {
      const passwordHash = await this.authLib.hashPassword(dto.password);

      await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          avatarUrl: dto.avatarUrl,
        },
      });

      return {
        status: 'success',
        message: 'User signed up successfully',
      };
    } catch {
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

  async validateOrCreateGoogleUser(googleUser: CreateGoogleDto) {
    try {
      // Check if user exists in database
      let user = await this.authLib.findUserByEmail(googleUser.email);

      if (!user) {
        // User doesn't exist, create new user
        try {
          user = await this.prisma.user.create({
            data: {
              name: googleUser.name,
              email: googleUser.email,
              passwordHash: '', // Google users don't have passwords
              avatarUrl: googleUser.avatarUrl,
            },
            include: { companies: true },
          });
        } catch (createError) {
          console.error('Error creating Google user:', createError);
          // Retry user creation once
          await new Promise((resolve) => setTimeout(resolve, 1000));
          try {
            user = await this.prisma.user.create({
              data: {
                name: googleUser.name,
                email: googleUser.email,
                passwordHash: '', // Google users don't have passwords
                avatarUrl: googleUser.avatarUrl,
              },
              include: { companies: true },
            });
          } catch (retryCreateError) {
            console.error(
              'Retry failed for creating Google user:',
              retryCreateError,
            );
            throw new InternalServerErrorException(
              'Database connection error during Google user creation',
            );
          }
        }
      }

      return user;
    } catch (error) {
      console.error(
        'Database connectivity error in validateOrCreateGoogleUser:',
        error,
      );
      throw new InternalServerErrorException(
        'Database connection error during Google authentication',
      );
    }
  }

  async signInWithGoogleUser(googleUser: any, res: Response) {
    // Usuario validado y creado por GoogleStrategy
    try {
      const token = await this.authLib.generateToken(googleUser);
      this.authLib.addCookie(res, token);
      return {
        id: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
      };
    } catch {
      throw new InternalServerErrorException('Internal server error');
    }
  }
}

