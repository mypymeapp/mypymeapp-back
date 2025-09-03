/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor() {
        super({
        // Para refrescar, aceptamos el token por header (Bearer) o por el header 'x-refresh-token'
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req) => req?.headers?.['x-refresh-token'] as string,
            ]),
            secretOrKey: process.env.JWT_REFRESH_SECRET!,
            ignoreExpiration: false,
            passReqToCallback: true,
        });
    }

    async validate(req: any, payload: any) {
        const refreshToken =
        (req.headers['x-refresh-token'] as string) || 
        ExtractJwt.fromAuthHeaderAsBearerToken()(req);

        if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

        // payload: { sub: userId, sessionId }
        return { userId: payload.sub, sessionId: payload.sessionId, refreshToken };
    }
}
