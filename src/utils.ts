import path from 'path';
import dotenv from "dotenv";
import axios from 'axios';
import moment from 'moment';

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

/**
 * This function takes date string in `dd/mm/yyyy` format and 
 * returns the starting unix time of that date as `start` and
 * the starting unix time of the next date as `end` 
 * 
 * @param date: string
 * @returns Object<start:number, end:number>
 */
export function get_epoch_time_from_date(date: string) {
    const search_date = moment(date.split("/").reverse().join("-")).utc();
    const next_date = search_date.clone().add(1, 'days');

    return {start: search_date.unix(), end: next_date.unix()};
}
