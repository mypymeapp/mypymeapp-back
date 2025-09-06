import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SignupDto } from 'src/auth/dto/signup.dto';
import { SigninDto } from 'src/auth/dto/signin.dto';
import * as bcrypt from 'bcrypt';   
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { Response } from 'express';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) {}

    async signIn(dto: SigninDto, res: Response) {
        
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new NotFoundException('Usuario no encontrado');
        }

        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new ForbiddenException('Credenciales inválidas');
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
        };

        const token = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '15m',
        });

        // Establecer cookie HTTP-only con el token
        res.cookie('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS en producción
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000, // 15 minutos en milliseconds
        });

        return { user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
        } };
    }

    async signUp(dto: SignupDto, res: Response) {
        // Verificar si ya existe el usuario
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (user) throw new ForbiddenException('Usuario ya existe');

        // Encriptar la contraseña
        const passwordHash = await bcrypt.hash(dto.password, 10);

        // Crear usuario (NO pasamos dto completo porque incluye `password`)
        const newUser = await this.prisma.user.create({
            data: {
            name: dto.name,
            email: dto.email,
            passwordHash,
            avatarUrl: dto.avatarUrl,
            },
        });

        // Generar token
        const payload = { id: newUser.id, name: newUser.name, email: newUser.email };
        const token = this.jwtService.sign(payload, {
            secret: process.env.JWT_SECRET,
            expiresIn: '15m',
        });

        // Guardar token en cookie HTTP-only
        res.cookie('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000,
        });

        return {
            user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            avatarUrl: newUser.avatarUrl,
            createdAt: newUser.createdAt,
            },
        };
    }

    async signOut(res: Response) {
        res.clearCookie('auth-token');
        return { message: 'Logout exitoso' };
    }
}
