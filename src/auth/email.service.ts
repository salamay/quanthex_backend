import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { Resend } from 'resend';

@Injectable()
export class EmailApiService {
  private readonly logger = new Logger(EmailApiService.name);
  private from: string;
  private otpTemplateId?: string;
  private resend : Resend;


  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.from = this.config.get<string>('MAIL_FROM') || `no-reply@${this.config.get<string>('MAIL_DOMAIN') || 'localhost'}`;
      this.otpTemplateId = this.config.get<string>('RESEND_OTP_TEMPLATE_ID');
    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY is not set; email sending will fail until it is configured.');
    } 
  }

  async sendOtpEmail(to: string, subject: string, otp: string){
    try {
      setImmediate(async () => {
        const res = await this.resend.emails.send({
            from: this.from,
            to: to,
            subject: subject,
            template: {
              id: 'one-time-password',
              variables: {
                OTP_CODE: otp,
              },
            }
        });
        console.log(res);
      });
    } catch (err) {
      this.logger.error('Failed to send email', err as any);
      throw err;
    }
  }
}
