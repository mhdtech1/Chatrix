export type TikTokAuthResult = {
  sessionId: string;
  ttTargetIdc: string;
};

export class TikTokAuthService {
  async signIn(): Promise<TikTokAuthResult> {
    throw new Error("TikTokAuthService.signIn is not wired yet.");
  }
}
