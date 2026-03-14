import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupInput } from './dto/signup.input';
import { LoginInput } from './dto/login.input';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Token } from './models/token.model';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Cadastrar novo usuário',
    description: 'Cria um usuário com base no nome, email e senha fornecidos',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: Token,
  })
  @ApiResponse({
    status: 400,
    description: 'Email já cadastrado ou dados inválidos',
  })
  signup(@Body() input: SignupInput): Promise<Token> {
    return this.authService.createUser(input);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login',
    description: 'Autentica o usuário e retorna tokens JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: Token,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  login(@Body() input: LoginInput): Promise<Token> {
    return this.authService.login(input.email, input.password);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Renovar token',
    description: 'Gera um novo accessToken a partir do refreshToken',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    type: Token,
  })
  @ApiResponse({
    status: 401,
    description: 'RefreshToken inválido ou expirado',
  })
  @ApiResponse({
    status: 400,
    description: 'RefreshToken não fornecido',
  })
  refresh(@Body('refreshToken') refreshToken: string): Token {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Usuário autenticado',
    description: 'Retorna os dados do usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do usuário retornados com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado - token inválido',
  })
  me(@CurrentUser() user: User): User {
    return user;
  }
}
