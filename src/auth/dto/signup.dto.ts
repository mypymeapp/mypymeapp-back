import { IsDate, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {

    @ApiProperty({ example: "John Doe" })
    @IsString() 
    name: string;

    @ApiProperty({ example: "user@example.com" })
    @IsEmail() 
    email: string;

    @ApiProperty({ example: "password" })
    @MinLength(8) 
    password: string;

    @ApiProperty({ example: "https://example.com/avatar.jpg" })
    @IsOptional() 
    @IsString() 
    avatarUrl?: string;
}

export class SignupResponseDto {

    @ApiProperty({ example: "123e4567-e89b-12d3-a456-426614174000" })
    @IsString()
    id: string;
    
    @ApiProperty({ example: "John Doe" })
    @IsString()
    name: string;
    
    @ApiProperty({ example: "user@example.com" })
    @IsEmail()
    email: string;
    
    @ApiProperty({ example: "https://example.com/avatar.jpg" })
    @IsOptional()
    @IsString()
    avatarUrl?: string;
    
    @ApiProperty({ example: "2023-01-01T00:00:00.000Z" })
    @IsDate()
    createdAt: Date;
}
