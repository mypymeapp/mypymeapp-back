import { Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { User, Role } from "@prisma/client";
import { PrismaService } from "prisma/prisma.service";


@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const user = request.user as User;

        if (!user) {
            throw new UnauthorizedException('Usuario no autenticado');
        }

        // Get company ID from request params or query
        const companyId = request.params.companyId || (request.query.companyId as string);

        if (!companyId) {
            throw new ForbiddenException('Company ID is required for role-based access');
        }

        // Find user's role in the specific company
        const userCompany = await this.prisma.userCompany.findUnique({
            where: {
                userId_companyId: {
                    userId: user.id,
                    companyId: companyId,
                },
            },
        });

        if (!userCompany) {
            throw new ForbiddenException('User is not a member of this company');
        }

        // Check if user's role is in the required roles
        const hasRole = requiredRoles.includes(userCompany.role);
        
        if (!hasRole) {
            throw new ForbiddenException(`Acceso denegado. Roles requeridos: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}