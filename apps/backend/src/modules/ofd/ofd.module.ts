import { Module, Global } from '@nestjs/common';
import { OfdService } from './ofd.service';

@Global()
@Module({
  providers: [OfdService],
  exports: [OfdService],
})
export class OfdModule {}
