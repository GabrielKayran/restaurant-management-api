import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiUnitHeader } from '../common/decorators/api-unit-header.decorator';
import { CurrentScope } from '../common/decorators/current-scope.decorator';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { RequestScope } from '../common/models/request-scope.model';
import { PaginationResponse } from '../common/pagination';
import { CustomerDetailsResponseDto } from './dto/customer-details.response';
import { CustomerListItemResponseDto } from './dto/customer-list-item.response';
import { CustomersListQueryDto } from './dto/customers-list.query';
import { CreateCustomerInput } from './dto/create-customer.input';
import { UpdateCustomerInput } from './dto/update-customer.input';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@ApiBearerAuth()
@ApiUnitHeader()
@UseGuards(JwtAuthGuard, UnitScopeGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({
    summary: 'List customers',
    description:
      'Returns paginated customers for the current restaurant context with optional search.',
  })
  @ApiOkResponse({
    description: 'Customers listed successfully.',
    type: PaginationResponse,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User has no access to the selected unit scope.',
  })
  list(
    @CurrentScope() scope: RequestScope,
    @Query() query: CustomersListQueryDto,
  ): Promise<PaginationResponse<CustomerListItemResponseDto>> {
    return this.customersService.list(scope, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get customer details',
    description: 'Returns one customer with addresses.',
  })
  @ApiOkResponse({
    description: 'Customer fetched successfully.',
    type: CustomerDetailsResponseDto,
  })
  getById(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<CustomerDetailsResponseDto> {
    return this.customersService.getById(scope, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create customer',
    description: 'Creates a customer for the current restaurant context.',
  })
  @ApiCreatedResponse({
    description: 'Customer created successfully.',
    type: CustomerDetailsResponseDto,
  })
  create(
    @CurrentScope() scope: RequestScope,
    @Body() input: CreateCustomerInput,
  ): Promise<CustomerDetailsResponseDto> {
    return this.customersService.create(scope, input);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update customer',
    description: 'Updates customer data and the primary address when informed.',
  })
  @ApiOkResponse({
    description: 'Customer updated successfully.',
    type: CustomerDetailsResponseDto,
  })
  update(
    @CurrentScope() scope: RequestScope,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() input: UpdateCustomerInput,
  ): Promise<CustomerDetailsResponseDto> {
    return this.customersService.update(scope, id, input);
  }
}
