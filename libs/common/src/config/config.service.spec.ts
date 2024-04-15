/* eslint-disable import/no-extraneous-dependencies */
/*
https://docs.nestjs.com/fundamentals/testing#unit-testing
*/

import { Test } from '@nestjs/testing';
import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { configModuleOptions } from './env.config';

const setupConfigService = async (envObj: any): Promise<ConfigService> => {
  jest.resetModules();
  Object.keys(process.env).forEach((key) => {
    delete process.env[key];
  });
  process.env = {
    ...envObj,
  };
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        ...configModuleOptions,
        ignoreEnvFile: true,
        load: [() => process.env],
      }),
    ],
    controllers: [],
    providers: [ConfigService],
  }).compile();

  await ConfigModule.envVariablesLoaded;

  return moduleRef.get<ConfigService>(ConfigService);
};

describe('ContentWatcherConfigService', () => {
  const ALL_ENV: { [key: string]: string | undefined } = {
    REDIS_URL: undefined,
    FREQUENCY_URL: undefined,
    STARTING_BLOCK: undefined,
    IPFS_ENDPOINT: undefined,
    IPFS_GATEWAY_URL: undefined,
    IPFS_BASIC_AUTH_USER: undefined,
    IPFS_BASIC_AUTH_SECRET: undefined,
    BLOCKCHAIN_SCAN_INTERVAL_MINUTES: undefined,
    QUEUE_HIGH_WATER: undefined,
    WEBHOOK_FAILURE_THRESHOLD: undefined,
    API_PORT: undefined,
  };

  beforeAll(() => {
    Object.keys(ALL_ENV).forEach((key) => {
      ALL_ENV[key] = process.env[key];
    });
  });

  describe('invalid environment', () => {
    it('missing redis url should fail', async () => {
      const { REDIS_URL: dummy, ...env } = ALL_ENV;
      await expect(setupConfigService({ ...env })).rejects.toBeDefined();
    });

    it('invalid redis url should fail', async () => {
      const { REDIS_URL: dummy, ...env } = ALL_ENV;
      await expect(setupConfigService({ REDIS_URL: 'invalid url', ...env })).rejects.toBeDefined();
    });

    it('missing frequency url should fail', async () => {
      const { FREQUENCY_URL: dummy, ...env } = ALL_ENV;
      await expect(setupConfigService({ ...env })).rejects.toBeDefined();
    });

    it('invalid frequency url should fail', async () => {
      const { FREQUENCY_URL: dummy, ...env } = ALL_ENV;
      await expect(setupConfigService({ FREQUENCY_URL: 'invalid url', ...env })).rejects.toBeDefined();
    });

    it('invalid scan interval should fail', async () => {
      const { BLOCKCHAIN_SCAN_INTERVAL_MINUTES: dummy, ...env } = ALL_ENV;
      await expect(setupConfigService({ BLOCKCHAIN_SCAN_INTERVAL_MINUTES: -1, ...env })).rejects.toBeDefined();
      await expect(setupConfigService({ BLOCKCHAIN_SCAN_INTERVAL_MINUTES: 0, ...env })).rejects.toBeDefined();
      await expect(setupConfigService({ BLOCKCHAIN_SCAN_INTERVAL_MINUTES: 'foo', ...env })).rejects.toBeDefined();
    });

    it('invalid queue high water should fail', async () => {
      const { QUEUE_HIGH_WATER: dummy, ...env } = ALL_ENV;
      await expect(setupConfigService({ QUEUE_HIGH_WATER: -1, ...env })).rejects.toBeDefined();
      await expect(setupConfigService({ QUEUE_HIGH_WATER: 99, ...env })).rejects.toBeDefined();
      await expect(setupConfigService({ QUEUE_HIGH_WATER: 'foo', ...env })).rejects.toBeDefined();
    });

    it('invalid api port should fail', async () => {
      const { API_PORT: dummy, ...env } = ALL_ENV;
      await expect(setupConfigService({ API_PORT: -1, ...env })).rejects.toBeDefined();
    });
  });

  describe('valid environment', () => {
    let contentWatcherConfigService: ConfigService;
    beforeAll(async () => {
      contentWatcherConfigService = await setupConfigService(ALL_ENV);
    });

    it('should be defined', () => {
      expect(contentWatcherConfigService).toBeDefined();
    });

    it('should get redis url', () => {
      expect(contentWatcherConfigService.redisUrl?.toString()).toStrictEqual(ALL_ENV.REDIS_URL?.toString());
    });

    it('should get frequency url', () => {
      expect(contentWatcherConfigService.frequencyUrl?.toString()).toStrictEqual(ALL_ENV.FREQUENCY_URL?.toString());
    });

    it('should get scan interval', () => {
      expect(contentWatcherConfigService.getBlockchainScanIntervalMinutes()).toStrictEqual(parseInt(ALL_ENV.BLOCKCHAIN_SCAN_INTERVAL_MINUTES as string, 10));
    });

    it('should get queue high water mark', () => {
      expect(contentWatcherConfigService.getQueueHighWater()).toStrictEqual(parseInt(ALL_ENV.QUEUE_HIGH_WATER as string, 10));
    });

    it('should get api port', () => {
      expect(contentWatcherConfigService.getApiPort()).toStrictEqual(parseInt(ALL_ENV.API_PORT as string, 10));
    });
  });
});
