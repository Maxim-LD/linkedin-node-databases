const axios = require('axios');

class CoinAPI {
  constructor(apiUrl = 'https://api.coinpaprika.com/v1/tickers') {
    this.apiUrl = apiUrl;
  }

  // eslint-disable-next-line class-methods-use-this
  formatDate(date) {
    const d = new Date(date);
    let month = `${d.getMonth() + 1}`;
    let day = `${d.getDate()}`;
    const year = `${d.getFullYear()}`;

    if (month.length < 2) month = `0${month}`;
    if (day.length < 2) day = `0${day}`;

    return [year, month, day].join('-');
  }

  setApiUrl(apiUrl) {
    this.apiUrl = apiUrl;
  }

  async fetch() {
    const url = this.apiUrl;
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching data from CoinAPI:', error.message);
      throw error;
    }
  }
}

module.exports = CoinAPI;
