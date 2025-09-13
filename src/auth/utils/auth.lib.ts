import * as bcrypt from 'bcrypt';
import { User, Company } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { SigninDto } from '../dto/signin.dto';
import { PrismaService } from 'prisma/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateGoogleDto } from '../dto/google.dto';

@Injectable()
export class AuthLib {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(data: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        companies: true,
      },
    });
    let company: Company | null = null;
    if (user?.companies?.length && user.companies.length > 0) {
      company = await this.prisma.company.findUnique({
        where: { id: user.companies[0].companyId },
      });
    }

    return { user, company };
  }

  async validateUserGoogle(data: CreateGoogleDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        companies: true,
      },
    });
    let company: Company | null = null;
    if (user?.companies?.length && user.companies.length > 0) {
      company = await this.prisma.company.findUnique({
        where: { id: user.companies[0].companyId },
      });
    }

    return { user, company };
  }

  async comparePassword(password: string, hash: string) {
    const compare = await bcrypt.compare(password, hash);
    return compare;
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async generateToken(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '8h',
    });
  }

  async generateRefreshToken(user: User) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    });
  }

  async addCookie(res: Response, token: string) {
    res.cookie('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS en producción
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 horas en milliseconds
    });
    return res;
  }
}

