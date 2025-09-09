import { Injectable, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { SignupDto } from 'src/auth/dto/signup.dto';
import { SigninDto } from 'src/auth/dto/signin.dto';
import { PrismaService } from 'prisma/prisma.service';
import { AuthLib } from './utils/auth.lib';
import { Response } from 'express';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService, 
        private authLib: AuthLib
    ) {}

    async validateUser(email: string, password: string) {
        const user = await this.authLib.validateUser({ email, password });
        if (!user) return null;

        const compare = await this.authLib.comparePassword(password, user.passwordHash);
        if (!compare) return null;

        // Return user without password hash for security
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...result } = user;
        return result;
    }

    async signIn(dto: SigninDto, res: Response) {
        
        const user = await this.authLib.validateUser(dto);
        if (!user) throw new ForbiddenException('Invalid credentials');

        const compare = await this.authLib.comparePassword(dto.password, user.passwordHash);
        if (!compare) throw new ForbiddenException('Invalid credentials');

        try {
            const token = await this.authLib.generateToken(user);
            this.authLib.addCookie(res, token);
            return {
                id: user.id,
                name: user.name,
                email: user.email,
            };
        } catch {
            throw new InternalServerErrorException('Internal server error');
        }
    }

    async signUp(dto: SignupDto) {
        const user = await this.authLib.validateUser(dto);
        if (user) throw new ForbiddenException('User already exists');

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
            message: 'User signed out successfully' 
        };
    }

    async validateOrCreateGoogleUser(googleUser: any) {
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
                });
            } catch {
                throw new InternalServerErrorException('Error creating Google user');
            }
        }
        
        return user;
    }

    async signInWithGoogleUser(googleUser: any, res: Response) {
        // User is already validated and created by GoogleStrategy
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
