import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailApiService {
  private readonly logger = new Logger(EmailApiService.name);
  private from: string;
  private otpTemplateId?: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('SENDGRID_API_KEY');
    this.from = this.config.get<string>('MAIL_FROM') || `no-reply@${this.config.get<string>('MAIL_DOMAIN') || 'localhost'}`;
      this.otpTemplateId = this.config.get<string>('SENDGRID_OTP_TEMPLATE_ID');
    if (!apiKey) {
      this.logger.warn('SENDGRID_API_KEY is not set; email sending will fail until it is configured.');
    } else {
      sgMail.setApiKey(apiKey);
    }
  }

  async sendOtpEmail(to: string, subject: string, otp: string){
    try {
        if (this.otpTemplateId) {
            const msg = {
                to: to,
                subject: subject,
                from: { email: this.from,name: 'Quanthex' },
                templateId: this.otpTemplateId,
                dynamicTemplateData: { subject, otp },
                // personalizations: [{
                //     to: { email: to },
                //     from: { email: this.from, name: 'Quanthex' },
                //     subject: subject,
                // }],
            
            } as any;
            const res = await sgMail.send(msg);
            this.logger.debug(`SendGrid response: ${JSON.stringify(res)}`);
        }

    } catch (err) {
      this.logger.error('Failed to send email', err as any);
      throw err;
    }
  }
}
