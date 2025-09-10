import { ApiProperty } from "@nestjs/swagger";

//todo ********************** MESSAGE AUTH DTOs *******************************//
export class MessageDto {
    @ApiProperty({ example: 'success' })
    status: string;

    @ApiProperty({ example: 'User signed out successfully' })
    message: string;
}