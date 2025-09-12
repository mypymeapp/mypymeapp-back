import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer successfully created' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @ApiBody({ type: CreateCustomerDto })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateCustomerDto) {
    return this.customerService.createCustomer(data);
  }

  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'List of all customers' })
  @Get()
  async findAll() {
    return this.customerService.getAllCustomers();
  }

  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer details' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.customerService.getCustomerById(id);
  }
}

