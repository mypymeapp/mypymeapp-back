/* eslint-disable prettier/prettier */
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsString() 
    name: string;

    @IsEmail() 
    email: string;

    @MinLength(8) 
    password: string;

    @IsOptional() 
    @IsString() 
    avatarUrl?: string;
}
