import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YouTubeService } from './youtube.service';

@Module({
  imports: [ConfigModule],
  providers: [YouTubeService],
  exports: [YouTubeService],
})
export class YouTubeModule {}
