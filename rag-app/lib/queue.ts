import IORedis from "ioredis";
import { Queue } from "bullmq";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const pdfQueue = new Queue("pdfQueue", {
  connection,
});