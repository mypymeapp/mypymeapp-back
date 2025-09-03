/* eslint-disable prettier/prettier */
import { IsEmail, IsString } from "class-validator";

export class UpdateProfileDto {
    @IsString()
    name?: string;

    @IsEmail() 
    email?: string;
    
    @IsString()
    avatarUrl?: string;
}