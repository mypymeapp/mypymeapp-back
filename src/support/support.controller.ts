import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';

// Interfaz para el Request con usuario autenticado
interface RequestWithUser extends ExpressRequest {
  user?: {
    sub: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
  };
}

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ==================================
  // Endpoints para usuarios regulares
  // ==================================
  @Post('tickets')
  async createTicket(@Request() req: RequestWithUser, @Body() createTicketDto: CreateTicketDto) {
    // Usar un ID de usuario fijo para testing - TEMPORAL
    const userId = req.user?.sub || 'test-user-id';
    return this.supportService.createTicket(userId, createTicketDto);
  }

  @Get('my-tickets')
  async getMyTickets(@Request() req: RequestWithUser, @Query() query: TicketQueryDto) {
    // Usar un ID de usuario fijo para testing - TEMPORAL
    const userId = req.user?.sub || 'test-user-id';
    return this.supportService.getUserTickets(userId, query);
  }

  @Get('tickets/:id')
  async getTicket(@Param('id', ParseUUIDPipe) id: string) {
    const ticket = await this.supportService.findTicketById(id);
    
    return ticket;
  }

  @Post('tickets/:id/messages')
  async addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
    @Body() createMessageDto: CreateMessageDto
  ) {
    const ticket = await this.supportService.findTicketById(id);
    
    // Para testing, usar addAdminMessage por defecto
    const userId = req.user?.sub || 'test-admin-id';
    return this.supportService.addAdminMessage(id, userId, createMessageDto);
  }

  @Get('tickets/:id/messages')
  async getTicketMessages(@Param('id', ParseUUIDPipe) id: string, @Request() req: RequestWithUser) {
    return this.supportService.getTicketMessages(id);
  }

  // =================================
  // Endpoints para administradores
  // =================================

  @Get('admin/tickets')
  async getAllTickets(@Query() query: TicketQueryDto) {
    return this.supportService.findTickets(query);
  }

  @Get('admin/my-assigned')
  async getMyAssignedTickets(@Request() req: RequestWithUser, @Query() query: TicketQueryDto) {
    const adminId = req.user?.sub || 'test-admin-id';
    return this.supportService.getAdminTickets(adminId, query);
  }

  @Patch('admin/tickets/:id')
  async updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto
  ) {
    return this.supportService.updateTicket(id, updateTicketDto);
  }

  @Delete('admin/tickets/:id')
  async deleteTicket(@Param('id', ParseUUIDPipe) id: string) {
    await this.supportService.deleteTicket(id);
    return { message: 'Ticket eliminado exitosamente' };
  }

  @Post('admin/tickets/:id/assign/:adminId')
  async assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('adminId', ParseUUIDPipe) adminId: string
  ) {
    return this.supportService.assignTicket(id, adminId);
  }

  @Post('admin/tickets/:id/messages')
  async addAdminMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
    @Body() createMessageDto: CreateMessageDto
  ) {
    const adminId = req.user?.sub || 'test-admin-id';
    return this.supportService.addAdminMessage(id, adminId, createMessageDto);
  }

  @Get('admin/stats')
  async getTicketStats() {
    return this.supportService.getTicketStats();
  }

  // Endpoint público para estadísticas básicas (si se necesita)
  @Get('stats')
  async getBasicStats() {
    return this.supportService.getTicketStats();
  }
}
