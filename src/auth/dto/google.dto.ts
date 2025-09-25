import { ApiProperty } from "@nestjs/swagger";

export class CreateGoogleDto {
    @ApiProperty({ example: "John Doe" })
    name: string;
    
    @ApiProperty({ example: "user@example.com" })
    email: string;
    
    @ApiProperty({ example: "https://example.com/avatar.jpg" })
    avatarUrl?: string;
}

export class ResponseGoogleDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' })
    token: string;
    
    @ApiProperty({
        example: {
            id: '1',
            name: 'John Doe',
            email: 'john.doe@example.com',
            avatarUrl: 'https://example.com/avatar.jpg',
            company: {
                id: '1',
                name: 'My Company',
            },
        },
    })
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string; 
        company: {
            id: string;
            name: string;
        };
    };
}
