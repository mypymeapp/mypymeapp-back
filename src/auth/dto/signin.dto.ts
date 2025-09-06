import { IsEmail, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SigninDto {

    @ApiProperty({ example: "user@example.com" })
    @IsEmail() 
    email: string;

    @ApiProperty({ example: "password" })
    @MinLength(8) 
    password: string;
}

export class SigninResponseDto {
    @ApiProperty({ example: "user@example.com" })
    email: string;

    @ApiProperty({ example: "mytoken" })
    token: string;
}
    