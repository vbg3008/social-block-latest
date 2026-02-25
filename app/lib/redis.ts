import { createClient } from 'redis';

const globalForRedis = global as unknown as { redisClient: ReturnType<typeof createClient> };

export const redisClient =
  globalForRedis.redisClient ||
  createClient({
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 11187,
    },
  });

if (process.env.NODE_ENV !== 'production') globalForRedis.redisClient = redisClient;

export async function connectRedis() {
  if (!redisClient.isOpen) {
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();
    console.log('Connected to Cloud Redis');
  }
  return redisClient;
}
