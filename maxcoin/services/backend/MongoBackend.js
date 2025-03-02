/* eslint-disable no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-empty-function */

const { MongoClient } = require('mongodb');
const CoinAPI = require('../CoinAPI');

class MongoBackend {

  constructor() {
    this.coinAPI = new CoinAPI();
    this.mongoUrl = "mongodb://localhost:37017/maxcoin";
    this.client = null;
    this.collection = null;
  }

  async connect() {
    const mongoClient = new MongoClient(this.mongoUrl);
    this.client = await mongoClient.connect();
    this.collection = this.client.db("maxcoin").collection("values");
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      return this.client.close();
    }
    return false;
  }

  async insert() {
    try {
      const data = await this.coinAPI.fetch();
      const documents = [];
      Object.entries(data).forEach((entry) => {
        documents.push({
          date: new Date(entry[1].last_updated).toISOString().split('T')[0],
          value: entry[1].quotes.USD.price
        });
      });
      return this.collection.insertMany(documents);
    } catch (error) {
      console.error('Error inserting data into MongoDB:', error.message);
      throw error;
    }
  }

  async getMax() {
    return this.collection.findOne({}, {sort: {value: -1}})
  }

  async max() {
    console.info("Connection to MongoDB");
    console.time("mongodb-connect");
    const client = await this.connect();
    if (client.topology.isConnected()) {
      console.info("Successfully connected to MongoDB");
    } else {
      throw new Error("Connecting to MongoDB failed");
    }
    console.timeEnd("mongodb-connect");

    console.info("Inserting into MongoDB");
    console.time("mongodb-insert");
    const insertResult = await this.insert();
    console.timeEnd("mongodb-insert");

    console.info(`Inserted ${insertResult.insertedCount} documents into MongoDB`);

    console.info("Querying MongoDb")
    console.time("mongodb-find")
    const doc = await this.getMax()
    console.timeEnd("mongodb-find")

    console.time("mongodb-disconnect");
    console.info("Disconnecting from MongoDB");
    console.time("mongodb-connect");
    await this.disconnect();
    console.timeEnd("mongodb-disconnect");

    return {
      date: doc.date,
      value: doc.value
    }
  }
}

module.exports = MongoBackend;