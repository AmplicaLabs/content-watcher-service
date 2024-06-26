import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@songkeys/nestjs-redis';
import { ConfigModule } from '../config/config.module';
import { ConfigService } from '../config/config.service';
import * as QueueConstants from '../utils/queues';
import { PubSubService } from './pubsub.service';
import { BroadcastSubscriber } from './announcers/broadcast';
import { ProfileSubscriber } from './announcers/profile';
import { ReactionSubscriber } from './announcers/reaction';
import { ReplySubscriber } from './announcers/reply';
import { TomstoneSubscriber } from './announcers/tombstone';
import { UpdateSubscriber } from './announcers/update';

@Module({
  imports: [
    ConfigModule,
    RedisModule.forRootAsync(
      {
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          config: [{ url: configService.redisUrl.toString() }],
        }),
        inject: [ConfigService],
      },
      true, // isGlobal
    ),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Note: BullMQ doesn't honor a URL for the Redis connection, and
        // JS URL doesn't parse 'redis://' as a valid protocol, so we fool
        // it by changing the URL to use 'http://' in order to parse out
        // the host, port, username, password, etc.
        // We could pass REDIS_HOST, REDIS_PORT, etc, in the environment, but
        // trying to keep the # of environment variables from proliferating
        const url = new URL(configService.redisUrl.toString().replace(/^redis[s]*/, 'http'));
        const { hostname, port, username, password, pathname } = url;
        return {
          connection: {
            host: hostname || undefined,
            port: port ? Number(port) : undefined,
            username: username || undefined,
            password: password || undefined,
            db: pathname?.length > 1 ? Number(pathname.slice(1)) : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QueueConstants.BROADCAST_QUEUE_NAME,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QueueConstants.REPLY_QUEUE_NAME,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QueueConstants.REACTION_QUEUE_NAME,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QueueConstants.TOMBSTONE_QUEUE_NAME,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QueueConstants.PROFILE_QUEUE_NAME,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
      {
        name: QueueConstants.UPDATE_QUEUE_NAME,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      },
    ),
    EventEmitterModule.forRoot({
      // Use this instance throughout the application
      global: true,
      // set this to `true` to use wildcards
      wildcard: false,
      // the delimiter used to segment namespaces
      delimiter: '.',
      // set this to `true` if you want to emit the newListener event
      newListener: false,
      // set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // the maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
    ScheduleModule.forRoot(),
  ],
  providers: [PubSubService, BroadcastSubscriber, ProfileSubscriber, ReactionSubscriber, ReplySubscriber, TomstoneSubscriber, UpdateSubscriber],
  controllers: [],
  exports: [PubSubService],
})
export class PubSubModule {}
