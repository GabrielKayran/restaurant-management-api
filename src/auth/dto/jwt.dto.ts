export interface JwtDto {
  userId: string;
  tenantId?: string;
  iat: number;
  exp: number;
}
