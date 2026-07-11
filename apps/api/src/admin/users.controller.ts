import { Controller, Get, Put, Param, Body, Query, UseGuards, BadRequestException, Post } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DatabaseService } from '../database/database.service';
import { Prisma } from '@prisma/client';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private db: DatabaseService) {}

  @Post()
  async createUser(
    @Body() body: {
      name?: string;
      email: string;
      password?: string;
      role?: string;
      businessName?: string;
      businessType?: string;
      country?: string;
      tokenAmount?: number;
    },
  ) {
    const { name, email, password, role, businessName, businessType, country, tokenAmount } = body;
    
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const existingUser = await this.db.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const initialTokens = tokenAmount || 0.0;

    return this.db.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: role || 'USER',
          businessName,
          businessType,
          country,
        },
      });

      const wallet = await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: initialTokens,
        },
      });

      if (initialTokens > 0) {
        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: initialTokens,
            type: 'ADMIN_CREDIT',
            description: 'Initial tokens granted by admin',
          },
        });
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        walletBalance: wallet.balance,
      };
    });
  }

  @Get()
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    
    if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const where: Prisma.UserWhereInput = search
      ? { 
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
            { businessName: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    let orderByClause: any = { [sortBy]: order };
    if (sortBy === 'wallet' || sortBy === 'balance') {
      orderByClause = { wallet: { balance: order } };
    } else if (sortBy === 'totalSpent') {
      orderByClause = { wallet: { totalSpent: order } };
    }

    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          businessName: true,
          createdAt: true,
          wallet: {
            select: {
              balance: true,
              totalSpent: true,
            }
          }
        },
        orderBy: orderByClause,
      }),
      this.db.user.count({ where }),
    ]);

    return {
      users,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    };
  }

  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { role?: string; isActive?: boolean },
  ) {
    return this.db.user.update({
      where: { id },
      data: {
        ...(body.role && { role: body.role }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }
}
