import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
        private reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        
        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        
        // Extraer token de la cookie o header
        let token = request.cookies['auth-token'];

        if (!token) {
            const authHeader = request.headers['authorization'];
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7); // quitar "Bearer "
            }
        }

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
            request.user = {
                ...payload,
                name: user.name,
                email: user.email,
                companyId: payload.companyId, // si lo incluís en el token
            };
            
            return true;
        } catch {
            throw new UnauthorizedException('Token inválido o expirado');
        }
    }
}
