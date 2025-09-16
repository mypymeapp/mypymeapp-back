import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  Delete,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

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

  @ApiOperation({ summary: 'Get a customer by Company ID' })
  @ApiResponse({ status: 200, description: 'Customer details' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  @Get(':companyId/customers')
  async getCompanyCustomers(@Param('companyId') companyId: string) {
    return this.customerService.getCustomersByCompany(companyId);
  }

  @ApiOperation({ summary: 'Update a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer or Company not found' })
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateCustomerDto,
  ) {
    return this.customerService.updateCustomer(id, data);
  }

  @ApiOperation({ summary: 'Delete a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.customerService.deleteCustomer(id);
  }
}

