import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { PasswordService } from '../auth/password.service';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  controllers: [StaffController],
  providers: [StaffService, PasswordService, RolesGuard],
})
export class StaffModule {}
