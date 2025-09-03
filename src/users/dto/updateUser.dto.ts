/* eslint-disable prettier/prettier */
import { IsEmail, IsString } from "class-validator";

/* eslint-disable prettier/prettier */
export class UpdateUserDto {
    @IsString() 
    name: string;

    @IsEmail() 
    email: string;

    @IsString() 
    avatarUrl?: string;
}