import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../auth/models/authenticated-user.model';
import { ApiUnitHeader } from '../common/decorators/api-unit-header.decorator';
import { CurrentScope } from '../common/decorators/current-scope.decorator';
import { UnitScopeGuard } from '../common/guards/unit-scope.guard';
import { RequestScope } from '../common/models/request-scope.model';
import { RestaurantSettingsResponseDto } from './dto/restaurant-settings.response';
import { UnitOrderingSettingsResponseDto } from './dto/unit-ordering.response';
import { UnitSettingsResponseDto } from './dto/unit-settings.response';
import { UpdateRestaurantSettingsInput } from './dto/update-restaurant-settings.input';
import { UpdateUnitOrderingInput } from './dto/update-unit-ordering.input';
import { UpdateUnitSettingsInput } from './dto/update-unit-settings.input';
import { SettingsService } from './settings.service';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.MANAGER)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('restaurant')
  @ApiOperation({
    summary: 'Get restaurant settings',
    description:
      'Returns the current tenant basic settings used by the back-office application.',
  })
  @ApiOkResponse({
    description: 'Restaurant settings returned successfully.',
    type: RestaurantSettingsResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  @ApiForbiddenResponse({
    description: 'Owner or manager permissions are required.',
  })
  getRestaurant(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RestaurantSettingsResponseDto> {
    return this.settingsService.getRestaurant(user);
  }

  @Patch('restaurant')
  @ApiOperation({
    summary: 'Update restaurant settings',
    description:
      'Updates the current tenant basic information without changing the tenant slug.',
  })
  @ApiOkResponse({
    description: 'Restaurant settings updated successfully.',
    type: RestaurantSettingsResponseDto,
  })
  updateRestaurant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: UpdateRestaurantSettingsInput,
  ): Promise<RestaurantSettingsResponseDto> {
    return this.settingsService.updateRestaurant(user, input);
  }

  @Get('unit')
  @UseGuards(UnitScopeGuard)
  @ApiUnitHeader()
  @ApiOperation({
    summary: 'Get current unit settings',
    description:
      'Returns the selected unit basic settings. The unit header is optional when the user has a single active unit.',
  })
  @ApiOkResponse({
    description: 'Unit settings returned successfully.',
    type: UnitSettingsResponseDto,
  })
  getUnit(
    @CurrentScope() scope: RequestScope,
  ): Promise<UnitSettingsResponseDto> {
    return this.settingsService.getUnit(scope);
  }

  @Patch('unit')
  @UseGuards(UnitScopeGuard)
  @ApiUnitHeader()
  @ApiOperation({
    summary: 'Update current unit settings',
    description:
      'Updates the selected unit basic configuration used by the operational front-end.',
  })
  @ApiOkResponse({
    description: 'Unit settings updated successfully.',
    type: UnitSettingsResponseDto,
  })
  updateUnit(
    @CurrentScope() scope: RequestScope,
    @Body() input: UpdateUnitSettingsInput,
  ): Promise<UnitSettingsResponseDto> {
    return this.settingsService.updateUnit(scope, input);
  }

  @Get('unit/ordering')
  @UseGuards(UnitScopeGuard)
  @ApiUnitHeader()
  @ApiOperation({
    summary: 'Get public ordering settings',
    description:
      'Returns operational settings for the public catalog, delivery coverage, fee rules and opening hours.',
  })
  @ApiOkResponse({
    description: 'Public ordering settings returned successfully.',
    type: UnitOrderingSettingsResponseDto,
  })
  getUnitOrdering(
    @CurrentScope() scope: RequestScope,
  ): Promise<UnitOrderingSettingsResponseDto> {
    return this.settingsService.getUnitOrdering(scope);
  }

  @Patch('unit/ordering')
  @UseGuards(UnitScopeGuard)
  @ApiUnitHeader()
  @ApiOperation({
    summary: 'Update public ordering settings',
    description:
      'Updates public menu settings, opening hours, delivery coverage and fee rules for the selected unit.',
  })
  @ApiOkResponse({
    description: 'Public ordering settings updated successfully.',
    type: UnitOrderingSettingsResponseDto,
  })
  updateUnitOrdering(
    @CurrentScope() scope: RequestScope,
    @Body() input: UpdateUnitOrderingInput,
  ): Promise<UnitOrderingSettingsResponseDto> {
    return this.settingsService.updateUnitOrdering(scope, input);
  }
}
