import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Status } from '@prisma/client';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene las estadísticas generales del dashboard
   */
  async getStats() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Usuarios
    const totalUsers = await this.prisma.user.count({
      where: { deletedAt: null }
    });

    const activeUsers = await this.prisma.user.count({
      where: { 
        isActive: true,
        deletedAt: null 
      }
    });

    const totalAdmins = await this.prisma.admin.count({
      where: { isActive: true }
    });

    const newUsersThisMonth = await this.prisma.user.count({
      where: {
        createdAt: { gte: firstDayOfMonth },
        deletedAt: null
      }
    });

    const newUsersLastMonth = await this.prisma.user.count({
      where: {
        createdAt: { 
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth
        },
        deletedAt: null
      }
    });

    // Calcular crecimiento de usuarios
    const userGrowthPercentage = newUsersLastMonth > 0 
      ? ((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100 
      : newUsersThisMonth > 0 ? 100 : 0;

    // Clientes (usuarios con empresas)
    const usersWithCompanies = await this.prisma.userCompany.findMany({
      select: { userId: true },
      distinct: ['userId']
    });

    const totalClients = usersWithCompanies.length;

    const activeClients = await this.prisma.user.count({
      where: {
        id: { in: usersWithCompanies.map(uc => uc.userId) },
        isActive: true,
        deletedAt: null
      }
    });

    const newClientsThisMonth = await this.prisma.userCompany.count({
      where: {
        createdAt: { gte: firstDayOfMonth }
      }
    });

    const newClientsLastMonth = await this.prisma.userCompany.count({
      where: {
        createdAt: { 
          gte: firstDayOfLastMonth,
          lte: lastDayOfLastMonth
        }
      }
    });

    const clientGrowthPercentage = newClientsLastMonth > 0
      ? ((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100
      : newClientsThisMonth > 0 ? 100 : 0;

    // Empresas
    const totalCompanies = await this.prisma.company.count();
    const activeCompanies = await this.prisma.company.count({
      where: { 
        subscriptionStatus: { not: 'FREE' } 
      }
    });

    // Tickets
    const totalTickets = await this.prisma.ticket.count();
    const openTickets = await this.prisma.ticket.count({
      where: { status: Status.ABIERTO }
    });
    const closedTickets = await this.prisma.ticket.count({
      where: { status: Status.CERRADO }
    });
    const pendingTickets = await this.prisma.ticket.count({
      where: { status: Status.EN_PROCESO }
    });

    const ticketResolutionRate = totalTickets > 0
      ? (closedTickets / totalTickets) * 100
      : 0;

    return {
      totalUsers,
      activeUsers,
      totalAdmins,
      newUsersThisMonth,
      totalClients,
      activeClients,
      totalCompanies,
      activeCompanies,
      totalTickets,
      openTickets,
      closedTickets,
      pendingTickets,
      userGrowthPercentage: Math.round(userGrowthPercentage * 10) / 10,
      clientGrowthPercentage: Math.round(clientGrowthPercentage * 10) / 10,
      ticketResolutionRate: Math.round(ticketResolutionRate * 10) / 10,
    };
  }

  /**
   * Obtiene los clientes más recientes
   */
  async getRecentClients(limit: number = 5) {
    const recentUserCompanies = await this.prisma.userCompany.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true
          }
        },
        company: {
          select: {
            name: true
          }
        }
      }
    });

    return recentUserCompanies.map(uc => ({
      id: uc.user.id,
      name: uc.user.name,
      email: uc.user.email,
      avatarUrl: uc.user.avatarUrl,
      company: {
        name: uc.company.name
      },
      createdAt: uc.createdAt.toISOString()
    }));
  }

  /**
   * Obtiene el feed de actividad reciente
   */
  async getActivityFeed(limit: number = 10) {
    const activities: any[] = [];

    // Usuarios recientes
    const recentUsers = await this.prisma.user.findMany({
      take: Math.ceil(limit / 3),
      orderBy: { createdAt: 'desc' },
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user_created',
        description: `Nuevo usuario registrado: ${user.name}`,
        timestamp: user.createdAt.toISOString(),
        user: {
          name: user.name,
          email: user.email
        }
      });
    });

    // Tickets recientes
    const recentTickets = await this.prisma.ticket.findMany({
      take: Math.ceil(limit / 3),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    recentTickets.forEach(ticket => {
      const type = ticket.status === Status.CERRADO ? 'ticket_closed' : 'ticket_created';
      const action = ticket.status === Status.CERRADO ? 'cerró' : 'creó';
      
      activities.push({
        id: `ticket-${ticket.id}`,
        type,
        description: `${ticket.user.name} ${action} un ticket: ${ticket.title}`,
        timestamp: ticket.createdAt.toISOString(),
        user: {
          name: ticket.user.name,
          email: ticket.user.email
        }
      });
    });

    // Ordenar por timestamp y limitar
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Obtiene los planes más populares (basado en subscripciones)
   */
  async getTopPlans(limit: number = 5) {
    const planStats = await this.prisma.company.groupBy({
      by: ['subscriptionStatus'],
      _count: {
        subscriptionStatus: true
      },
      orderBy: {
        _count: {
          subscriptionStatus: 'desc'
        }
      },
      take: limit
    });

    return planStats.map((stat, index) => ({
      id: `plan-${index}`,
      name: stat.subscriptionStatus === 'FREE' ? 'Plan Gratuito' : 'Plan Premium',
      subscriptionCount: stat._count.subscriptionStatus,
      revenue: stat.subscriptionStatus === 'PREMIUM' ? stat._count.subscriptionStatus * 29.99 : 0,
      growthPercentage: Math.random() * 20 - 5 // Simulado por ahora
    }));
  }

  /**
   * Obtiene datos para el gráfico de ventas/ingresos
   */
  async getSalesChartData(period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;
    let labels: string[];

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    }

    // Contar empresas premium por período
    const premiumCompanies = await this.prisma.company.count({
      where: {
        subscriptionStatus: 'PREMIUM',
        createdAt: { gte: startDate }
      }
    });

    // Simular datos de ventas (en producción, esto vendría de transacciones reales)
    const data = labels.map(() => Math.floor(Math.random() * 50) + 10);

    return {
      labels,
      datasets: [
        {
          label: 'Ventas',
          data
        }
      ]
    };
  }

  /**
   * Obtiene datos para el gráfico de clientes
   */
  async getClientsChartData(period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;
    let labels: string[];

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
    } else {
      startDate = new Date(now.getFullYear(), 0, 1);
      labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    }

    // Contar nuevos clientes por período
    const newClients = await this.prisma.userCompany.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    // Simular distribución de clientes
    const data = labels.map(() => Math.floor(Math.random() * 30) + 5);

    return {
      labels,
      datasets: [
        {
          label: 'Nuevos Clientes',
          data
        }
      ]
    };
  }
}
