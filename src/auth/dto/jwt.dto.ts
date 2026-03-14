export interface JwtDto {
  sub?: string;
  userId?: string;
  tenantId?: string;
  iat: number;
  exp: number;
}
