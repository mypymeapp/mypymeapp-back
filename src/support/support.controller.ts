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
    id?: string;        // ID del usuario (viene del JWT Guard)
    sub?: string;       // Subject (puede venir de otros guards)
    email?: string;
    role?: string;
    name?: string;
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
    // Obtener email del usuario desde el DTO (enviado por NextAuth en el frontend)
    const userEmail = createTicketDto.userEmail || 'sadmin@test.com';
    
    // Buscar usuario por email
    const user = await this.supportService.findUserByEmail(userEmail);
    if (!user) {
      throw new Error(`Usuario con email ${userEmail} no encontrado`);
    }
    
    return this.supportService.createTicket(user.id, createTicketDto);
  }

  @Get('my-tickets')
  async getMyTickets(@Request() req: RequestWithUser, @Query() query: TicketQueryDto) {
    // Obtener email del usuario desde el query (enviado por NextAuth en el frontend)
    const userEmail = query.userEmail || 'sadmin@test.com';
    
    // Buscar usuario por email
    const user = await this.supportService.findUserByEmail(userEmail);
    if (!user) {
      throw new Error(`Usuario con email ${userEmail} no encontrado`);
    }
    
    return this.supportService.getUserTickets(user.id, query);
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
    // Obtener email del usuario desde el DTO (enviado por NextAuth en el frontend)
    const userEmail = createMessageDto.userEmail || 'sadmin@test.com';
    
    // Buscar usuario por email
    const user = await this.supportService.findUserByEmail(userEmail);
    if (!user) {
      throw new Error(`Usuario con email ${userEmail} no encontrado`);
    }
    
    // Agregar mensaje como usuario (no admin)
    return this.supportService.addUserMessage(id, user.id, createMessageDto);
  }

  @Get('tickets/:id/messages')
  async getTicketMessages(@Param('id', ParseUUIDPipe) id: string) {
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
    const adminId = req.user?.sub || 'd69c050d-5c84-4bf6-b058-b914d7948930';
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
    // Obtener userId de la cookie o usar usuario por defecto
    const userId = req.user?.sub || req.cookies?.userId || 'sadmin@test.com';
    
    // Si es un email, buscar el usuario y su admin
    let adminId = userId;
    if (userId.includes('@')) {
      const user = await this.supportService.findUserByEmail(userId);
      if (user?.id) {
        // Buscar si el usuario tiene un registro de admin
        const admin = await this.supportService.findAdminByUserId(user.id);
        adminId = admin?.id || user.id;
      }
    }
    
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
