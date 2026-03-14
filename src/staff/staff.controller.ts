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
  ApiOperation,
  ApiResponse,
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
    summary: 'Cadastra colaborador interno para uma unidade do tenant atual',
  })
  @ApiResponse({
    status: 201,
    description: 'Colaborador vinculado com sucesso',
    type: StaffResponseDto,
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
    summary: 'Cria convite para colaborador no tenant atual',
  })
  @ApiResponse({
    status: 201,
    description: 'Convite criado com sucesso',
    type: StaffInviteResponseDto,
  })
  inviteStaff(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateStaffInviteInput,
  ): Promise<StaffInviteResponseDto> {
    return this.staffService.inviteStaff(currentUser, input);
  }

  @Post('accept-invite')
  @ApiOperation({
    summary: 'Aceita convite de colaborador e ativa vinculos de acesso',
  })
  @ApiResponse({
    status: 201,
    description: 'Convite aceito com sucesso',
    type: StaffResponseDto,
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
    summary: 'Lista colaboradores do tenant atual',
  })
  @ApiResponse({
    status: 200,
    description: 'Colaboradores listados com sucesso',
    type: [StaffListItemDto],
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
    summary: 'Atualiza status de ativacao de colaborador no tenant atual',
  })
  @ApiResponse({
    status: 200,
    description: 'Status do colaborador atualizado com sucesso',
    type: StaffListItemDto,
  })
  updateStaffStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() input: UpdateStaffStatusInput,
  ): Promise<StaffListItemDto> {
    return this.staffService.updateStaffStatus(currentUser, userId, input);
  }
}
