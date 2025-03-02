/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-empty-function */
const Redis = require("ioredis")

const CoinAPI = require('../CoinAPI');

class RedisBackend {

  constructor() {
    this.coinAPI = new CoinAPI();
    return this.client
  }

  async connect() {
    this.client = new Redis(7379)
    return this.client
  }

  async disconnect() {
    return this.client.disconnect()
  }

  async insert() {
    const data = await this.coinAPI.fetch()

      if (!Array.isArray(data)) {
        console.error("Invalid data format:", data)
        throw new Error("Expected an array but received something else")
      }
    const values = []
    data.forEach((coin) => {
        if (!coin.last_updated || !coin.quotes || !coin.quotes.USD || typeof coin.quotes.USD.price !== "number") {
            console.error(`Skipping invalid data for ${coin.id}:`, coin);
            return;
        }

        const timestamp = new Date(coin.last_updated).toISOString()// .split('T')[0]; // Convert date to YYYY-MM-DD format
        const {price} = coin.quotes.USD;
      
      values.push(price)
      values.push(timestamp)
    })

    if (values.length === 0) {
      throw new Error("No valid data to insert into Redis")
    }

    return this.client.zadd('maxcoin:values', values)
  }

  async getMax() {
    return this.client.zrange('maxcoin:values', -1, -1, 'WITHSCORES')
  }

  async max() {
     console.info("Connection to Redis")
     console.time("redis-connect")
     const client = this.connect()
     if (client) {
       console.info("Successfully connected to Redis")
     } else {
       throw new Error("Connecting to Redis failed")
     }
     console.timeEnd("redis-connect")

     console.info("Inserting into Redis")
     console.time("redis-insert")
     const insertResult = await this.insert()
     console.timeEnd("redis-insert")

     console.info(
       `Inserted ${insertResult} documents into Redis`
     )

     console.info("Querying Redis")
     console.time("redis-find")
     const result = await this.getMax()
     console.timeEnd("redis-find")

     console.time("redis-disconnect")
     console.info("Disconnecting from Redis")
     console.time("redis-connect")
     await this.disconnect()
    console.timeEnd("redis-disconnect")
    return result
  }
}

module.exports = RedisBackend;