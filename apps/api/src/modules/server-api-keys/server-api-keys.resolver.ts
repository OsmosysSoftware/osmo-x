import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ServerApiKeysService } from './server-api-keys.service';

@Resolver()
export class ServerApiKeysResolver {
  constructor(private serverApiKeysService: ServerApiKeysService) {}

  @Mutation(() => String)
  async generateToken(@Args('applicationId') applicationId: number): Promise<string> {
    return this.serverApiKeysService.generateApiKey(applicationId);
  }
}
