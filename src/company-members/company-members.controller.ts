import {
  Controller,
  Post,
  Param,
  Body,
  Get,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CompanyMembersService } from './company-members.service';
import { CreateCompanyMemberDto } from './dto/create-company-member.dto';
import { UpdateCompanyMemberDto } from './dto/update-company-member.dto';

@ApiTags('Company Members')
@Controller('company-members')
export class CompanyMembersController {
  constructor(private readonly companyMembersService: CompanyMembersService) {}

  @Post(':companyId')
  @ApiOperation({ summary: 'Add a new member to a company' })
  @ApiParam({
    name: 'companyId',
    description: 'ID of the company',
    type: String,
  })
  @ApiBody({ type: CreateCompanyMemberDto })
  @ApiResponse({
    status: 201,
    description: 'Member successfully created and linked to company',
  })
  addMember(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCompanyMemberDto,
  ) {
    return this.companyMembersService.addMember(companyId, dto);
  }

  @Get(':companyId')
  @ApiOperation({ summary: 'Get all members of a company' })
  @ApiParam({
    name: 'companyId',
    description: 'ID of the company',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of company members returned successfully',
  })
  getMembers(@Param('companyId') companyId: string) {
    return this.companyMembersService.getMembers(companyId);
  }

  @Patch(':companyId/:userId')
  @ApiOperation({ summary: 'Update a company member' })
  @ApiParam({
    name: 'companyId',
    description: 'ID of the company',
    type: String,
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to update',
    type: String,
  })
  @ApiBody({ type: UpdateCompanyMemberDto })
  @ApiResponse({ status: 200, description: 'Member successfully updated' })
  updateMember(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateCompanyMemberDto,
  ) {
    return this.companyMembersService.updateMember(companyId, userId, dto);
  }

  @Delete(':companyId/:userId')
  @ApiOperation({ summary: 'Remove a member from a company' })
  @ApiParam({
    name: 'companyId',
    description: 'ID of the company',
    type: String,
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user to remove',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Member successfully removed from company',
  })
  removeMember(
    @Param('companyId') companyId: string,
    @Param('userId') userId: string,
  ) {
    return this.companyMembersService.removeMember(companyId, userId);
  }
}

