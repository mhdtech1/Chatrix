export type YouTubeAuthConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
};

export type YouTubeAuthResult = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

export class YouTubeAuthService {
  constructor(private readonly config: YouTubeAuthConfig) {}

  getConfig(): YouTubeAuthConfig {
    return this.config;
  }

  async signIn(): Promise<YouTubeAuthResult> {
    throw new Error("YouTubeAuthService.signIn is not wired yet.");
  }
}
