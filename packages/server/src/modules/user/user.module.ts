import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '@prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
