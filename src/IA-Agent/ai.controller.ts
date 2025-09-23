// src/ai/ai.controller.ts
import { Controller, Post, Body, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { AiService } from './ai.service';

@ApiTags('AI') // Agrupa en Swagger bajo la sección "AI"
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask/:companyId')
  @ApiOperation({
    summary: 'Ask a question about the company’s data',
    description:
      'Allows the owner to ask a question about sales, purchases, projections, promotions, etc. The AI will respond based on the company’s historical data.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'The ID of the company for which to query data',
    type: String,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        question: {
          type: 'string',
          example: 'What were my top selling products last month?',
        },
      },
      required: ['question'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'AI response with an answer based on company data.',
    schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          example: 'Your top selling products last month were ...',
        },
      },
    },
  })
  async ask(
    @Param('companyId') companyId: string,
    @Body('question') question: string,
  ) {
    return {
      answer: await this.aiService.ask(companyId, question),
    };
  }
}

