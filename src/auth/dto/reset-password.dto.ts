/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
    @IsNotEmpty()
    @IsString()
    token: string;

    @IsNotEmpty()
    @MinLength(6)
    newPassword: string;
}