import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
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
    summary: 'Cadastrar novo tenant com usuario owner',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario e tenant criados com sucesso',
    type: Token,
  })
  signup(@Body() input: SignupInput): Promise<Token> {
    return this.authService.createUser(input);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: Token,
  })
  login(@Body() input: LoginInput): Promise<Token> {
    return this.authService.login(input.email, input.password);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    type: Token,
  })
  refresh(@Body('refreshToken') refreshToken: string): Token {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuario retornados com sucesso',
    type: UserResponseDto,
  })
  me(@CurrentUser() user: User) {
    return this.authService.getMe(user.id);
  }
}
