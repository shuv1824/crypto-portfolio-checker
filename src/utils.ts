import path from 'path';
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * This function fetches the exchange rates of the Cryptocurrencies from CryproExchange API.
 * https://min-api.cryptocompare.com/data/
 * 
 * @param fsyms string[]: Array of the crypto symbols
 * @param tsyms string[]: Array of the conversion currencies
 * @returns Promise
 */

export function get_exchange_rates(fsyms: string[], tsyms: string[]) {
    const api_key = process.env.CRYPTOCOMPARE_API_KEY;
    const api_base_url = 'https://min-api.cryptocompare.com/data/pricemulti';
    const api_endpoint = `${api_base_url}?fsyms=${fsyms.join(',')}&tsyms=${tsyms.join(',')}`;

    return new Promise((resolve, reject) => {
        axios.get(api_endpoint, {
            headers: {
               'Authorization': `Apikey ${api_key}` 
            }
        })
        .then(res => resolve(res.data))
        .catch(error => reject(error));
    });
}