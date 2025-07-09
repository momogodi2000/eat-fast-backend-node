const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../config/redis');

const createRedisRateLimiter = (options) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    }),
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options.max || 100,
    message: {
      error: options.message || 'Too many requests'
    },
    standardHeaders: true,
    legacyHeaders: false,
    ...options
  });
};

// Specific rate limiters
const strictRateLimit = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many requests from this IP'
});

const moderateRateLimit = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP'
});

const lenientRateLimit = createRedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP'
});

module.exports = {
  createRedisRateLimiter,
  strictRateLimit,
  moderateRateLimit,
  lenientRateLimit
};