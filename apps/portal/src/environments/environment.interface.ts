export interface Environment {
  production: boolean;
  graphqlEndpoint: string;
  serverApiKey?: string; // Make serverApiKey optional
}
