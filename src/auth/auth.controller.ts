import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, SignupResponseDto } from 'src/auth/dto/signup.dto';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { SigninDto, SigninResponseDto } from 'src/auth/dto/signin.dto';
import type { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  GetCurrentUser,
  type CurrentUser,
} from './decorators/current-user.decorator';
import { ApiTags } from '@nestjs/swagger';
import { CreateGoogleDto, ResponseGoogleDto } from './dto/google.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
@ApiTags('Authentications')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiBody({ type: SignupDto })
  @ApiCreatedResponse({ type: SignupResponseDto })
  @ApiOperation({ summary: 'Create new user' })
  @Post('register')
  async register(@Body() dto: SignupDto) {
    return this.authService.signUp(dto);
  }

  @ApiBody({ type: SigninDto })
  @ApiCreatedResponse({ type: SigninResponseDto })
  @ApiOperation({ summary: 'User login' })
  @Post('login')
  async login(
    @Body() dto: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signIn(dto, res);
  }

  @ApiBody({ type: CreateGoogleDto })
  @ApiCreatedResponse({ type: ResponseGoogleDto })
  @ApiOperation({ summary: 'User login with Google' })
  @Post('login/google')
  async loginWithGoogle(
    @Body() dto: CreateGoogleDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signInWithGoogle(dto, res);
  }

  @ApiOperation({ summary: 'User logout' })
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.signOut(res);
  }

  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @Get('profile')
  async getProfile(@GetCurrentUser() user: CurrentUser) {
    return {
      message: 'Perfil obtenido exitosamente',
      user,
    };
  }

  @ApiOperation({ summary: 'Forgot password - request reset link' })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}

