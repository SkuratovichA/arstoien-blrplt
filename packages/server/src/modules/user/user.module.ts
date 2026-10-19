import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { UserResolver } from './user.resolver.js';
import { UserService } from './user.service.js';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  providers: [UserService, UserResolver],
  exports: [UserService],
})
export class UserModule {}
