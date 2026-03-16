import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
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
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { AcceptStaffInviteInput } from './dto/accept-staff-invite.input';
import { CreateStaffInput } from './dto/create-staff.input';
import { CreateStaffInviteInput } from './dto/create-staff-invite.input';
import { StaffInviteResponseDto } from './dto/staff-invite-response.dto';
import { StaffListItemDto } from './dto/staff-list-item.dto';
import { StaffResponseDto } from './dto/staff-response.dto';
import { UpdateStaffStatusInput } from './dto/update-staff-status.input';
import { StaffService } from './staff.service';

@ApiTags('Staff')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Create staff member',
    description:
      'Creates and links an internal staff member to a unit in the current tenant context.',
  })
  @ApiCreatedResponse({
    description: 'Staff member created and linked successfully.',
    type: StaffResponseDto,
    schema: {
      example: {
        userId: 'uuid-do-usuario',
        name: 'Carlos Lima',
        email: 'carlos@restaurante.com',
        tenantId: 'uuid-do-tenant',
        unitId: 'uuid-da-unidade',
        role: 'WAITER',
        isActive: true,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User does not have enough permission.',
  })
  createStaff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateStaffInput,
  ): Promise<StaffResponseDto> {
    return this.staffService.createStaff(currentUser, input);
  }

  @Post('invite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Create staff invite',
    description:
      'Creates an invite token so a collaborator can join the current tenant and unit.',
  })
  @ApiCreatedResponse({
    description: 'Staff invite created successfully.',
    type: StaffInviteResponseDto,
    schema: {
      example: {
        inviteId: 'uuid-do-convite',
        email: 'colaborador@restaurante.com',
        tenantId: 'uuid-do-tenant',
        unitId: 'uuid-da-unidade',
        role: 'WAITER',
        status: 'PENDING',
        token: 'TOKEN_DE_CONVITE',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User does not have enough permission.',
  })
  inviteStaff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateStaffInviteInput,
  ): Promise<StaffInviteResponseDto> {
    return this.staffService.inviteStaff(currentUser, input);
  }

  @Post('accept-invite')
  @ApiOperation({
    summary: 'Accept staff invite',
    description:
      'Validates an invite token and activates tenant and unit membership for the invited collaborator.',
  })
  @ApiCreatedResponse({
    description: 'Staff invite accepted successfully.',
    type: StaffResponseDto,
    schema: {
      example: {
        userId: 'uuid-do-usuario',
        name: 'Carlos Lima',
        email: 'carlos@restaurante.com',
        tenantId: 'uuid-do-tenant',
        unitId: 'uuid-da-unidade',
        role: 'WAITER',
        isActive: true,
      },
    },
  })
  acceptInvite(
    @Body() input: AcceptStaffInviteInput,
  ): Promise<StaffResponseDto> {
    return this.staffService.acceptInvite(input);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'List tenant staff members',
    description: 'Lists all collaborators linked to the current tenant.',
  })
  @ApiOkResponse({
    description: 'Staff members listed successfully.',
    type: StaffListItemDto,
    isArray: true,
    schema: {
      example: [
        {
          userId: 'uuid-do-usuario',
          name: 'Carlos Lima',
          email: 'carlos@restaurante.com',
          isActive: true,
          role: 'WAITER',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User does not have enough permission.',
  })
  listStaff(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<StaffListItemDto[]> {
    return this.staffService.listStaff(currentUser);
  }

  @Patch(':userId/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({
    summary: 'Update staff active status',
    description:
      'Activates or deactivates a collaborator in the current tenant.',
  })
  @ApiOkResponse({
    description: 'Staff status updated successfully.',
    type: StaffListItemDto,
    schema: {
      example: {
        userId: 'uuid-do-usuario',
        name: 'Carlos Lima',
        email: 'carlos@restaurante.com',
        isActive: false,
        role: 'WAITER',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'User does not have enough permission.',
  })
  updateStaffStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() input: UpdateStaffStatusInput,
  ): Promise<StaffListItemDto> {
    return this.staffService.updateStaffStatus(currentUser, userId, input);
  }
}
