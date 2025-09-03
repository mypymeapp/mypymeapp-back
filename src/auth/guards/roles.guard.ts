/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client'; // 👈 Enum con tus roles
import { ROLES_KEY } from './roles.decorator'; // 👈 Decorador personalizado

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // 1. Recuperar roles requeridos (si existen) desde el decorador @Roles()
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
        );

        // Si la ruta no tiene restricción de roles, dejamos pasar
        if (!requiredRoles) return true;

        // 2. Obtener el usuario del request (ya agregado por el AuthGuard/JWT)
        const { user } = context.switchToHttp().getRequest();

        if (!user) {
        throw new ForbiddenException('No se encontró información del usuario');
        }

        // 3. Verificar si el rol del usuario coincide con alguno de los requeridos
        const hasRole = requiredRoles.some((role) => user.role === role);

        if (!hasRole) {
        throw new ForbiddenException(
            `Acceso denegado: se requiere uno de los roles [${requiredRoles.join(
            ', ',
            )}]`,
        );
        }

        // 4. Si cumple, se permite el acceso
        return true;
    }
}
