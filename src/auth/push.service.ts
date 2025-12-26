import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;

  constructor(private config: ConfigService) {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    const path = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');

    try {
    
      if (path) {
        // load a local json file path (absolute or project-relative)
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const serviceAccount = require(path);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        this.initialized = true;
        this.logger.log(`Firebase admin initialized from file ${path}`);
        return;
      }

      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Let the SDK pick up default credentials from environment
        admin.initializeApp();
        this.initialized = true;
        this.logger.log('Firebase admin initialized with application default credentials');
        return;
      }

      this.logger.warn('No Firebase credentials provided; PushService not initialized.');
    } catch (err) {
      this.logger.error('Failed to initialize Firebase admin', err as any);
    }
  }
  

  async sendToToken(token: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized) throw new Error('Firebase admin not initialized');

    const message: admin.messaging.Message = {
      token,
      notification: { title, body },
      data: data || undefined,
    };

    try {
      const response = await admin.messaging().send(message);
      this.logger.log(`Push sent: ${response}`);
      return response;
    } catch (err) {
      this.logger.error('Failed to send push to token', err as any);
      throw err;
    }
  }

  async sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>) {
    if (!this.initialized) throw new Error('Firebase admin not initialized');

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data: data || undefined,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(`Multicast push: success=${response.successCount} failure=${response.failureCount}`);
      return response;
    } catch (err) {
      this.logger.error('Failed to send multicast push', err as any);
      throw err;
    }
  }
}
