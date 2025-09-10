import { Injectable, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import googleOAuthConfig from "../utils/google-oauth.config";
import type { ConfigType } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(googleOAuthConfig.KEY) 
        private googleConfiguration: ConfigType<typeof googleOAuthConfig>,
        private authService: AuthService
    ) {
        super({
            clientID: googleConfiguration.clientID!,
            clientSecret: googleConfiguration.clientSecret!,
            callbackURL: googleConfiguration.callbackURL!,
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string, 
        refreshToken: string, 
        profile: any, 
        done: VerifyCallback
    ) {
        const googleUser = {
            name: `${profile.name.givenName} ${profile.name.familyName}`,
            email: profile.emails[0].value,
            avatarUrl: profile.photos[0].value,
        };

        // Use AuthService method to validate or create Google user
        const user = await this.authService.validateOrCreateGoogleUser(googleUser);
        
        return done(null, user);
    }
}