import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { Ticket, TicketMessage, Priority, Status, Department } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  // Buscar usuario por email
  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true }
    });
  }

  // Buscar admin por userId
  async findAdminByUserId(userId: string) {
    return this.prisma.admin.findUnique({
      where: { userId },
      select: { id: true, role: true, department: true }
    });
  }

  // Crear un nuevo ticket
  async createTicket(userId: string, createTicketDto: CreateTicketDto): Promise<Ticket> {
    // Extraer solo los campos que existen en el modelo Ticket
    const { title, description, priority, department } = createTicketDto;
    
    return this.prisma.ticket.create({
      data: {
        title,
        description,
        userId,
        priority: priority || Priority.MEDIA,
        department: department || Department.TECNICO,
        status: Status.ABIERTO,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        assignedAdmin: {
          select: { 
            id: true, 
            role: true, 
            department: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true } },
            admin: { 
              select: { 
                id: true, 
                role: true,
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    });
  }

  // Obtener tickets con paginación y filtros
  async findTickets(query: TicketQueryDto = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      priority,
      department,
      userId,
      assignedAdminId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = query;

    // Convertir page y limit a números enteros
    const pageNum = parseInt(page.toString(), 10) || 1;
    const limitNum = parseInt(limit.toString(), 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (department) where.department = department;
    if (userId) where.userId = userId;
    if (assignedAdminId) where.assignedAdminId = assignedAdminId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          assignedAdmin: {
            select: { 
            id: true, 
            role: true, 
            department: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, name: true } },
              admin: { 
              select: { 
                id: true, 
                role: true,
                user: {
                  select: { id: true, name: true }
                }
              }
            }
            }
          },
          _count: {
            select: { messages: true }
          }
        }
      }),
      this.prisma.ticket.count({ where })
    ]);

    return {
      tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  // Obtener un ticket por ID
  async findTicketById(id: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        assignedAdmin: {
          select: { 
            id: true, 
            role: true, 
            department: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true } },
            admin: { 
              select: { 
                id: true, 
                role: true,
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    return ticket;
  }

  // Actualizar un ticket
  async updateTicket(id: string, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findTicketById(id);
    
    return this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        assignedAdmin: {
          select: { 
            id: true, 
            role: true, 
            department: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true } },
            admin: { 
              select: { 
                id: true, 
                role: true,
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });
  }

  // Eliminar un ticket
  async deleteTicket(id: string): Promise<void> {
    const ticket = await this.findTicketById(id);
    
    // Eliminar mensajes relacionados primero
    await this.prisma.ticketMessage.deleteMany({
      where: { ticketId: id }
    });
    
    // Eliminar el ticket
    await this.prisma.ticket.delete({
      where: { id }
    });
  }

  // Asignar ticket a un admin
  async assignTicket(ticketId: string, adminId: string): Promise<Ticket> {
    const ticket = await this.findTicketById(ticketId);
    
    // Verificar que el admin existe
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId }
    });
    
    if (!admin) {
      throw new NotFoundException('Admin no encontrado');
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        assignedAdminId: adminId,
        status: Status.EN_PROCESO
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        assignedAdmin: {
          select: { 
            id: true, 
            role: true, 
            department: true,
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true } },
            admin: { 
              select: { 
                id: true, 
                role: true,
                user: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      }
    });
  }

  // Agregar mensaje de usuario
  async addUserMessage(ticketId: string, userId: string, createMessageDto: CreateMessageDto): Promise<TicketMessage> {
    const ticket = await this.findTicketById(ticketId);
    
    // Verificar que el usuario es el propietario del ticket
    if (ticket.userId !== userId) {
      throw new ForbiddenException('No tienes permisos para agregar mensajes a este ticket');
    }

    return this.prisma.ticketMessage.create({
      data: {
        ticketId,
        userId,
        message: createMessageDto.message,
        isFromUser: true
      },
      include: {
        user: { select: { id: true, name: true } },
        admin: { 
              select: { 
                id: true, 
                role: true,
                user: {
                  select: { id: true, name: true }
                }
              }
            }
      }
    });
  }

  // Agregar mensaje de admin
  async addAdminMessage(ticketId: string, adminId: string, createMessageDto: CreateMessageDto): Promise<TicketMessage> {
    const ticket = await this.findTicketById(ticketId);

    return this.prisma.ticketMessage.create({
      data: {
        ticketId,
        adminId,
        message: createMessageDto.message,
        isFromUser: false
      },
      include: {
        user: { select: { id: true, name: true } },
        admin: { 
              select: { 
                id: true, 
                role: true,
                user: {
                  select: { id: true, name: true }
                }
              }
            }
      }
    });
  }

  // Obtener mensajes de un ticket
  async getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
    const ticket = await this.findTicketById(ticketId);

    return this.prisma.ticketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true } },
        admin: { 
              select: { 
                id: true, 
                role: true,
                user: {
                  select: { id: true, name: true }
                }
              }
            }
      }
    });
  }

  // Obtener estadísticas de tickets
  async getTicketStats() {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      highPriorityTickets,
      criticalPriorityTickets
    ] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: Status.ABIERTO } }),
      this.prisma.ticket.count({ where: { status: Status.EN_PROCESO } }),
      this.prisma.ticket.count({ where: { status: Status.RESUELTO } }),
      this.prisma.ticket.count({ where: { status: Status.CERRADO } }),
      this.prisma.ticket.count({ where: { priority: Priority.ALTA } }),
      this.prisma.ticket.count({ where: { priority: Priority.CRITICA } })
    ]);

    // Estadísticas por departamento
    const departmentStats = await this.prisma.ticket.groupBy({
      by: ['department'],
      _count: {
        id: true
      }
    });

    // Estadísticas por prioridad
    const priorityStats = await this.prisma.ticket.groupBy({
      by: ['priority'],
      _count: {
        id: true
      }
    });

    // Tickets recientes (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTickets = await this.prisma.ticket.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        }
      }
    });

    // Tiempo promedio de resolución (tickets resueltos en los últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const resolvedTicketsWithTime = await this.prisma.ticket.findMany({
      where: {
        status: Status.RESUELTO,
        updatedAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    let averageResolutionTime = 0;
    if (resolvedTicketsWithTime.length > 0) {
      const totalTime = resolvedTicketsWithTime.reduce((acc, ticket) => {
        const resolutionTime = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
        return acc + resolutionTime;
      }, 0);
      averageResolutionTime = Math.round(totalTime / resolvedTicketsWithTime.length / (1000 * 60 * 60)); // en horas
    }

    return {
      total: totalTickets,
      byStatus: {
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets
      },
      byPriority: {
        high: highPriorityTickets,
        critical: criticalPriorityTickets,
        stats: priorityStats.reduce((acc, stat) => {
          acc[stat.priority] = stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      },
      byDepartment: departmentStats.reduce((acc, stat) => {
        acc[stat.department] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      recent: recentTickets,
      averageResolutionTimeHours: averageResolutionTime
    };
  }

  // Obtener tickets del usuario
  async getUserTickets(userId: string, query: TicketQueryDto = {}) {
    return this.findTickets({ ...query, userId });
  }

  // Obtener tickets asignados a un admin
  async getAdminTickets(adminId: string, query: TicketQueryDto = {}) {
    return this.findTickets({ ...query, assignedAdminId: adminId });
  }
}
