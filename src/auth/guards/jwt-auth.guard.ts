import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        
        // Extraer token de la cookie
        const token = request.cookies['auth-token'];
        
        if (!token) {
            throw new UnauthorizedException('Token de acceso requerido');
        }

        try {
            // Verificar y decodificar el token
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET,
            });

            // Verificar que el usuario existe en la base de datos
            const user = await this.prisma.user.findUnique({
                where: { id: payload.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    isActive: true,
                }
            });

            if (!user || !user.isActive) {
                throw new UnauthorizedException('Usuario no válido o inactivo');
            }

            // Agregar usuario al request para uso posterior
            request.user = user;
            
            return true;
        } catch {
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }
}
