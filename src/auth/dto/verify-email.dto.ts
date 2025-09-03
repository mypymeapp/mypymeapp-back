/* eslint-disable prettier/prettier */
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyEmailDto {
    @IsNotEmpty()
    @IsString()
    token: string;
}