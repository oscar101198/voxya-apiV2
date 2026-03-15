import { BadGatewayException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import { CallService } from "./call.service";

describe("CallService", () => {
  let service: CallService;
  let httpService: HttpService;
  let configService: ConfigService;

  const baseUrl = "https://fullsave.wildixin.com";
  const wildixUserId = "wildix_user_123";
  const destNumber = "+33612345678";

  beforeEach(async () => {
    const mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
    };
    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === "WILDIX_BASE_URL") return baseUrl;
        if (key === "WILDIX_API_KEY") return "test-api-key";
        if (key === "WILDIX_SIP_DOMAIN") return "185.249.184.38";
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CallService>(CallService);
    httpService = module.get<HttpService>(HttpService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("makeCall", () => {
    it("should call Wildix API with POST, correct URL and body", async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: { ok: true }, status: 200, statusText: "OK", headers: {}, config: {} })
      );

      await service.makeCall(wildixUserId, destNumber);

      const expectedUrl = `${baseUrl}/api/v2/call-control/make-call/?user=${encodeURIComponent(wildixUserId)}`;
      expect(httpService.post).toHaveBeenCalledWith(
        expectedUrl,
        {
          destination: destNumber,
          callType: "mobility",
          deviceContact: `sip:${wildixUserId}@185.249.184.38`,
        },
        expect.any(Object)
      );
    });

    it("should send WILDIX_API_KEY in headers when configured", async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: {}, status: 200, statusText: "OK", headers: {}, config: {} })
      );

      await service.makeCall(wildixUserId, destNumber);

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("test-api-key"),
          }),
        })
      );
    });

    it("should return response data on HTTP 2xx", async () => {
      const responseData = { callId: "call-456", status: "initiated" };
      (httpService.post as jest.Mock).mockReturnValue(
        of({ data: responseData, status: 200, statusText: "OK", headers: {}, config: {} })
      );

      const result = await service.makeCall(wildixUserId, destNumber);

      expect(result).toEqual(responseData);
    });

    it("should throw BadGatewayException on HTTP 4xx", async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => ({ response: { status: 400, data: { error: "Bad request" } } }))
      );

      await expect(
        service.makeCall(wildixUserId, destNumber)
      ).rejects.toThrow(BadGatewayException);
    });

    it("should throw BadGatewayException on HTTP 5xx", async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => ({ response: { status: 502, data: {} } }))
      );

      await expect(
        service.makeCall(wildixUserId, destNumber)
      ).rejects.toThrow(BadGatewayException);
    });

    it("should throw BadGatewayException on network error", async () => {
      (httpService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error("Network error"))
      );

      await expect(
        service.makeCall(wildixUserId, destNumber)
      ).rejects.toThrow(BadGatewayException);
    });
  });
});
