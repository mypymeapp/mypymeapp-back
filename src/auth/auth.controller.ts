import { Controller, Post, Body, Res, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, SignupResponseDto } from 'src/auth/dto/signup.dto';
import { ApiBody, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SigninDto, SigninResponseDto } from 'src/auth/dto/signin.dto';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  GetCurrentUser,
  type CurrentUser,
} from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ApiTags } from '@nestjs/swagger';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';

// Interface to extend Express Request with user property from Passport.js
interface RequestWithUser extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

@Controller('auth')
@ApiTags('Authentications')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiBody({ type: SignupDto })
  @ApiCreatedResponse({ type: SignupResponseDto })
  @Post('register')
  async register(
    @Body() dto: SignupDto,
  ) {
    return this.authService.signUp(dto);
  }

  @ApiBody({ type: SigninDto })
  @ApiCreatedResponse({ type: SigninResponseDto })
  @Post('login')
  async login(
    @Body() dto: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(dto, res);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.signOut(res);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  async getProfile(@GetCurrentUser() user: CurrentUser) {
    return {
      message: 'Perfil obtenido exitosamente',
      user,
    };
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  async googleLogin() {}

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    await this.authService.signInWithGoogleUser(req.user, res);
    res.redirect('/');
  }
}
