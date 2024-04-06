import { Module } from '@nestjs/common';
import { ServerapikeysService } from './serverapikeys.service';
import { ServerapikeysResolver } from './serverapikeys.resolver';

@Module({
  providers: [ServerapikeysResolver, ServerapikeysService],
})
export class ServerapikeysModule {}
