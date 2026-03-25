import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { RateLimit } from './decorators/rate-limit.decorator';
import { RefreshInput } from './dto/refresh.input';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginInput } from './dto/login.input';
import { SignupInput } from './dto/signup.input';
import { UserResponseDto } from './dto/user-response.dto';
import { Token } from './models/token.model';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Register owner account and initial tenant',
    description:
      'Creates a new owner user, tenant and initial unit, returning access and refresh tokens.',
  })
  @ApiCreatedResponse({
    description: 'Owner account and tenant created successfully.',
    type: Token,
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token',
      },
    },
  })
  @ApiTooManyRequestsResponse({
    description: 'Too many signup attempts from the same client.',
  })
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ key: 'auth:signup', limit: 3, windowMs: 10 * 60 * 1000 })
  signup(@Body() input: SignupInput): Promise<Token> {
    return this.authService.createUser(input);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Authenticate user',
    description: 'Authenticates credentials and returns a new token pair.',
  })
  @ApiOkResponse({
    description: 'User authenticated successfully.',
    type: Token,
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiTooManyRequestsResponse({
    description: 'Too many login attempts from the same client.',
  })
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ key: 'auth:login', limit: 5, windowMs: 60 * 1000 })
  login(@Body() input: LoginInput): Promise<Token> {
    return this.authService.login(input.email, input.password);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh token pair',
    description:
      'Rotates tokens using a valid refresh token and returns a fresh access and refresh token pair.',
  })
  @ApiOkResponse({
    description: 'Token pair refreshed successfully.',
    type: Token,
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-access-token',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new-refresh-token',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token.' })
  @ApiTooManyRequestsResponse({
    description: 'Too many refresh attempts from the same client.',
  })
  @UseGuards(AuthRateLimitGuard)
  @RateLimit({ key: 'auth:refresh', limit: 20, windowMs: 60 * 1000 })
  refresh(@Body() input: RefreshInput): Token {
    return this.authService.refreshToken(input.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get authenticated user profile',
    description: 'Returns profile and scoped roles for the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Authenticated user profile returned successfully.',
    type: UserResponseDto,
    schema: {
      example: {
        id: '34d2d39a-2f7a-4f9c-ae6d-e1dc3eb9ddf4',
        name: 'Ana Paula Souza',
        email: 'ana@sabormineiro.com',
        isActive: true,
        tenantRoles: [
          {
            tenantId: 'tenant-id',
            role: 'OWNER',
          },
        ],
        unitRoles: [
          {
            id: '4f4f7db6-68de-4fa5-b512-6e4d56e9b8f8',
            name: 'Unidade Centro',
            tenantId: 'tenant-id',
            role: 'OWNER',
          },
        ],
        createdAt: '2026-03-14T13:00:00.000Z',
        updatedAt: '2026-03-14T13:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Authentication is required.' })
  me(@CurrentUser() user: User): Promise<UserResponseDto> {
    return this.authService.getMe(user.id);
  }
}
