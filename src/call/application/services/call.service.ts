import { BadGatewayException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { AxiosError } from "axios";

@Injectable()
export class CallService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async makeCall(
    wildixUserId: string,
    destNumber: string
  ): Promise<unknown> {
    const baseUrl =
      this.configService.get<string>("WILDIX_BASE_URL")?.replace(/\/$/, "");
    const apiKey = this.configService.get<string>("WILDIX_API_KEY");
    const sipDomain = this.configService.get<string>("WILDIX_SIP_DOMAIN");

    const url = `${baseUrl}/v2/call-control/make-call/?user=${encodeURIComponent(wildixUserId)}`;
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const body = {
      destination: destNumber,
      callType: "mobility",
      deviceContact: `sip:${wildixUserId}@${sipDomain}`,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<unknown>(url, body, { headers })
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<unknown>;
      const status = axiosError.response?.status;
      const message =
        status != null
          ? `Wildix API error: ${status}`
          : "Wildix API unavailable";
      throw new BadGatewayException(message);
    }
  }
}
