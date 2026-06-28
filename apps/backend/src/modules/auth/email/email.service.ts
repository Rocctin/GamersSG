import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { magicLinkTemplate } from "../templates/magic-link";

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromAddress = "Gamers.SG <noreply@gamers.sg>";

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    this.resend = new Resend(apiKey);
  }

  async sendMagicLinkEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL");
    const magicLink = `${frontendUrl}/verify?token=${token}`;
    const html = magicLinkTemplate(magicLink);

    // Always log the magic link in development
    if (this.configService.get<string>("NODE_ENV") === "development") {
      this.logger.log(`Magic link for ${email}: ${magicLink}`);
    }

    try {
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
