import { Resolver, Mutation, Args, Int } from '@nestjs/graphql';
import { ServerApiKeysService } from './server-api-keys.service';
import { GqlAuthGuard } from 'src/common/guards/gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { ServerApiKey } from './entities/server-api-key.entity';

@Resolver(() => ServerApiKey)
@UseGuards(GqlAuthGuard)
export class ServerApiKeysResolver {
  constructor(private serverApiKeysService: ServerApiKeysService) {}

  @Mutation(() => String)
  async generateApiKey(
    @Args('applicationId', { type: () => Int }) applicationId: number,
  ): Promise<string> {
    return this.serverApiKeysService.generateApiKey(applicationId);
  }
}
