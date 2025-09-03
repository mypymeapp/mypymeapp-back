/* eslint-disable prettier/prettier */
import { IsEmail } from "class-validator";

export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}