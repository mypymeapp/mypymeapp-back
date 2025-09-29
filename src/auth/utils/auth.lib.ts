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

  // en el auth.service.ts o auth.lib.ts
  async validateUser(data: SigninDto) {
    // 1. Encuentra el usuario y sus compañías
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        companies: {
          include: {
            company: true, // Incluye la información de la compañía
          },
        },
      },
    });

    // 2. Si no se encuentra el usuario, devuelve null
    if (!user) {
      return { user: null, role: null, company: null };
    }

    // 3. Verifica si el usuario tiene una compañía asociada
    if (user.companies.length > 0) {
      const userCompany = user.companies[0];
      const role = userCompany.role;
      const company = userCompany.company;
      return { user, role, company };
    }

    // 4. Si el usuario existe pero no tiene compañías, devuelve solo el usuario
    return { user, role: null, company: null };
  }

  async validateUserGoogle(data: CreateGoogleDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: {
        companies: {
          include: {
            company: true, // Incluye la información de la compañía
          },
        },
      },
    });

    // Si no se encuentra el usuario, devuelve null
    if (!user) {
      return { user: null, role: null, company: null };
    }

    // Verifica si el usuario tiene una compañía asociada
    if (user.companies.length > 0) {
      const userCompany = user.companies[0];
      const role = userCompany.role;
      const company = userCompany.company;
      return { user, role, company };
    }

    // Si el usuario existe pero no tiene compañías, devuelve solo el usuario
    return { user, role: null, company: null };
  }

  async comparePassword(password: string, hash: string) {
    const compare = await bcrypt.compare(password, hash);
    return compare;
  }

  async hashPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

async generateToken(user: User) {
      // Traer la primera compañía del usuario
        const userWithCompany = await this.prisma.user.findUnique({
            where: { id: user.id },
            include: { companies: true },
        });

        const payload: any = {
            id: user.id,
            email: user.email,
            name: user.name,
        };

        if (userWithCompany?.companies?.length) {
            payload.companyId = userWithCompany.companies[0].companyId;
        }

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

