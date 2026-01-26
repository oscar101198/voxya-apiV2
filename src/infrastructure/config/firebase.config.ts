import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

export const initializeFirebase = (configService: ConfigService): void => {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    const serviceAccountPath = configService.get(
      "FIREBASE_SERVICE_ACCOUNT_PATH"
    );

    let credential: admin.ServiceAccount;

    const fullPath = path.join(process.cwd(), serviceAccountPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Firebase service account file not found: ${fullPath}`);
    }

    const serviceAccountData = fs.readFileSync(fullPath, "utf8");
    credential = JSON.parse(serviceAccountData);

    admin.initializeApp({
      credential: admin.credential.cert(credential as admin.ServiceAccount),
    });
  }
};
