import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { convertDataToString } from "src/_utils";
import { initializeFirebase } from "../config/firebase.config";

export interface SendNotificationOptions {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    try {
      initializeFirebase(this.configService);
      this.logger.log("Firebase Admin initialized successfully");
    } catch (error) {
      this.logger.error(
        `Failed to initialize Firebase Admin: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Send notification to multiple devices
   */
  async sendNotification(options: SendNotificationOptions): Promise<void> {
    const { tokens, title, body, data, imageUrl } = options;

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data: data ? convertDataToString(data) : undefined,
      android: {
        priority: "high" as const,
        notification: {
          channelId: "default",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(`Successfully sent notification: ${response}`);
    } catch (error) {
      this.logger.error(
        `Failed to send multicast notification: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
