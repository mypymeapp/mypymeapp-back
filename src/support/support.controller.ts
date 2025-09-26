import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // ==================================
  // Endpoints para usuarios regulares
  // ==================================
  @Post('tickets')
  async createTicket(@Request() req, @Body() createTicketDto: CreateTicketDto) {
    return this.supportService.createTicket(req.user.sub, createTicketDto);
  }

  @Get('my-tickets')
  async getMyTickets(@Request() req, @Query() query: TicketQueryDto) {
    return this.supportService.getUserTickets(req.user.sub, query);
  }

  @Get('tickets/:id')
  async getTicket(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const ticket = await this.supportService.findTicketById(id);
    
    // Verificar permisos: solo el propietario o admin pueden ver el ticket
    if (ticket.userId !== req.user.sub && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('No tienes permisos para ver este ticket');
    }
    
    return ticket;
  }

  @Post('tickets/:id/messages')
  async addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body() createMessageDto: CreateMessageDto
  ) {
    const ticket = await this.supportService.findTicketById(id);
    
    // Verificar permisos
    if (ticket.userId !== req.user.sub && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('No tienes permisos para agregar mensajes a este ticket');
    }

    // Si es admin, usar addAdminMessage, si es usuario usar addUserMessage
    if (req.user.role === 'ADMIN') {
      return this.supportService.addAdminMessage(id, req.user.sub, createMessageDto);
    } else {
      return this.supportService.addUserMessage(id, req.user.sub, createMessageDto);
    }
  }

  @Get('tickets/:id/messages')
  async getTicketMessages(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    const ticket = await this.supportService.findTicketById(id);
    
    // Verificar permisos
    if (ticket.userId !== req.user.sub && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('No tienes permisos para ver los mensajes de este ticket');
    }
    
    return this.supportService.getTicketMessages(id);
  }

  // =================================
  // Endpoints para administradores
  // =================================

  @Get('admin/tickets')
  @UseGuards(RoleGuard)
  @Roles('SUPERADMIN')
  async getAllTickets(@Query() query: TicketQueryDto) {
    return this.supportService.findTickets(query);
  }

  @Get('admin/my-assigned')
  @UseGuards(RoleGuard)
  @Roles('SUPERADMIN')
  async getMyAssignedTickets(@Request() req, @Query() query: TicketQueryDto) {
    return this.supportService.getAdminTickets(req.user.sub, query);
  }

  @Patch('admin/tickets/:id')
  @UseGuards(RoleGuard)
  @Roles('SUPERADMIN')
  async updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto
  ) {
    return this.supportService.updateTicket(id, updateTicketDto);
  }

  @Delete('admin/tickets/:id')
  @UseGuards(RoleGuard)
  @Roles('SUPERADMIN')
  async deleteTicket(@Param('id', ParseUUIDPipe) id: string) {
    await this.supportService.deleteTicket(id);
    return { message: 'Ticket eliminado exitosamente' };
  }

  @Post('admin/tickets/:id/assign/:adminId')
  @UseGuards(RoleGuard)
  @Roles('SUPERADMIN')
  async assignTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('adminId', ParseUUIDPipe) adminId: string
  ) {
    return this.supportService.assignTicket(id, adminId);
  }

  @Post('admin/tickets/:id/messages')
  @UseGuards(RoleGuard)
  @Roles('SUPERADMIN')
  async addAdminMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req,
    @Body() createMessageDto: CreateMessageDto
  ) {
    return this.supportService.addAdminMessage(id, req.user.sub, createMessageDto);
  }

  @Get('admin/stats')
  @UseGuards(RoleGuard)
  @Roles('SUPERADMIN')
  async getTicketStats() {
    return this.supportService.getTicketStats();
  }

  // Endpoint público para estadísticas básicas (si se necesita)
  @Get('stats')
  @UseGuards(RoleGuard)
  @Roles('SUPERADMIN')
  async getBasicStats() {
    return this.supportService.getTicketStats();
  }
}
