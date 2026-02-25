export type KickAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type KickAuthResult = {
  accessToken: string;
  refreshToken: string;
  username: string;
};

export class KickAuthService {
  constructor(private readonly config: KickAuthConfig) {}

  getConfig(): KickAuthConfig {
    return this.config;
  }

  async signIn(): Promise<KickAuthResult> {
    throw new Error("KickAuthService.signIn is not wired yet.");
  }
}
