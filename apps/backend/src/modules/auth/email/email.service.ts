import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { magicLinkTemplate } from "../templates/magic-link";

@Injectable()
export class EmailService {
  private readonly resend: Resend | null;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromAddress = "Gamers.SG <noreply@gamers.sg>";
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    this.isConfigured = !!apiKey && apiKey !== "re_placeholder" && apiKey.startsWith("re_");
    if (this.isConfigured && apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      const isDev = this.configService.get<string>("NODE_ENV") === "development";
      if (!isDev) {
        this.logger.error("RESEND_API_KEY is not configured. Emails will not be sent.");
      }
    }
  }

  async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL");
    const magicLink = `${frontendUrl}/verify?token=${token}`;
    const isDev = this.configService.get<string>("NODE_ENV") === "development";

    // Always log the magic link in development
    if (isDev) {
      this.logger.log(`Magic link for ${email}: ${magicLink}`);
    }

    // Skip sending if Resend is not configured
    if (!this.resend) {
      if (isDev) {
        this.logger.warn("Resend not configured — skipping email send. Use the magic link logged above.");
      } else {
        this.logger.error("Resend not configured — unable to send email.");
      }
      return;
    }

    try {
      const html = magicLinkTemplate(magicLink);
      const result = await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: "Your Gamers.SG Login Link",
        html,
      });

      if (result.error) {
        this.logger.error(`Failed to send email to ${email}: ${result.error.message}`);
        // Don't throw — silently fail to not reveal if email exists
        return;
      }

      this.logger.log(`Magic link email sent to ${email}`);
    } catch (err) {
      this.logger.error(`Resend error for ${email}:`, err);
      // Don't throw — silently fail
    }
  }
}
