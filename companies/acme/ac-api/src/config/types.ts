export type PublicConfig = Readonly<{
  port: number;
  url: string;
}>;

export type SecretConfig = Readonly<{
  stripeApiKey: string;
}>;
