import { Resolver, Query, Args } from '@nestjs/graphql';
import { ServerApiKeysService } from './server-api-keys.service';
import { ServerApiKey } from './entities/server-api-key.entity';

@Resolver(() => ServerApiKey)
export class ServerApiKeysResolver {
  constructor(private readonly serverApiKeysService: ServerApiKeysService) {}

  @Query(() => [ServerApiKey], { name: 'serverApiKeys' })
  async findAllApiKeys(): Promise<ServerApiKey[]> {
    return this.serverApiKeysService.findAll();
  }

  @Query(() => ServerApiKey)
  async findApiKey(@Args('apiKey', { type: () => String }) apiKey: string): Promise<ServerApiKey> {
    return this.serverApiKeysService.findByServerApiKey(apiKey);
  }
}
