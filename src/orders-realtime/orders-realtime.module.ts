import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersRealtimeGateway } from './orders-realtime.gateway';
import { OrdersRealtimePublisher } from './orders-realtime.publisher';

@Global()
@Module({
  imports: [AuthModule],
  providers: [OrdersRealtimeGateway, OrdersRealtimePublisher],
  exports: [OrdersRealtimePublisher],
})
export class OrdersRealtimeModule {}
