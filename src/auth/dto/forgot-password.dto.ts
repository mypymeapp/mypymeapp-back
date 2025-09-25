import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ example: 'newStrongPassword123' })
    newPassword: string;

    @ApiProperty({ example: 'token-de-recuperacion' })
    token: string;
}
