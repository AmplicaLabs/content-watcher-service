/* eslint-disable no-underscore-dangle */
import { Injectable } from '@nestjs/common';
import { InjectQueue, Processor } from '@nestjs/bullmq';
import Redis from 'ioredis';
import { InjectRedis } from '@songkeys/nestjs-redis';
import { Job, Queue } from 'bullmq';
import * as QueueConstants from '../queues/queue-constants';
import { ChainWatchOptionsDto } from '../dtos/chain.watch.dto';
import { BaseConsumer } from '../utils/base-consumer';
import { ContentSearchRequestDto } from '../dtos/content-search-request.dto';
import { REGISTERED_WEBHOOK_KEY } from '../constants';
import { ChainEventProcessorService } from '../blockchain/chain-event-processor.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
@Processor(QueueConstants.REQUEST_QUEUE_NAME, {
  concurrency: 2,
})
export class CrawlerService extends BaseConsumer {
  constructor(
    @InjectRedis() private readonly cache: Redis,
    @InjectQueue(QueueConstants.IPFS_QUEUE) private readonly ipfsQueue: Queue,
    private readonly chainEventService: ChainEventProcessorService,
    private readonly blockchainService: BlockchainService,
  ) {
    super();
  }

  async process(job: Job<ContentSearchRequestDto, any, string>): Promise<void> {
    this.logger.log(`Processing crawler job ${job.id}: ${JSON.stringify(job.data)}`);

    try {
      let startBlock = job.data.startBlock;
      if (!startBlock) {
        startBlock = await this.blockchainService.getLatestFinalizedBlockNumber();
        this.logger.debug(`No starting block specified; starting from end of chain at block ${startBlock}`);
      }
      const blockList = new Array(job.data.blockCount).fill(0).map((_v, index) => startBlock - index);
      blockList.reverse();
      await this.processBlockList(job.data.clientReferenceId, blockList, job.data.filters);

      this.logger.log(`Finished processing job ${job.id}`);
    } catch (error) {
      this.logger.error(`Error processing crawler search job: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  private async processBlockList(clientReferenceId: string, blockList: number[], filters: ChainWatchOptionsDto) {
    this.logger.debug({ minBlock: Math.min(...blockList), maxBlock: Math.max(...blockList) }, 'Processing block list');
    await Promise.all(
      blockList.map(async (blockNumber) => {
        const messages = await this.chainEventService.getMessagesInBlock(blockNumber, filters);
        if (messages.length > 0) {
          this.logger.debug(`Found ${messages.length} messages for block ${blockNumber}`);
        }
        // eslint-disable-next-line no-await-in-loop
        await this.chainEventService.queueIPFSJobs(messages, this.ipfsQueue, clientReferenceId);
      }),
    );
  }
}
