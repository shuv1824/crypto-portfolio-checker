#! /usr/bin/node

import { createReadStream } from "fs";
// import { parse as csv_parse } from 'csv-parse';
import { parse, NODE_STREAM_INPUT } from 'papaparse';
import { Command } from 'commander';
import { Transaction, Portfolio, ExchangeRate, ConsoleResult, TimeRange } from './types';
import { get_exchange_rates, get_epoch_time_from_date } from './utils';

const execution_start = process.hrtime();

const program = new Command();

program
    .argument('<file>', 'Path of the CSV file with crypto investment transaction data.')
    .option('-t, --token <value>', 'The token for which latest portfolio will be given.')
    .option('-d, --date <value>', 'The date (dd/mm/yyyy or yyyy-mm-dd) on which portfolio for each token will be given.');

program.parse();

const [file] = program.args;
const options = program.opts();

let transaction_count = 0;
let matched_transaction_count = 0;
let time_range:TimeRange;

const portfolio:Portfolio = {};
const OUTPUT_CURRENCY = "USD";

if(options.date) {
    time_range = get_epoch_time_from_date(options.date);
}

/**
 * Below is the parser of `csv-parse` library which is not able to parse very large CSV files.
 */

// const headers = ['timestamp', 'transaction_type', 'token', 'amount'];
// const csv_parser = csv_parse({
//     delimiter: ',',
//     encoding: 'utf-8',
//     from_line: 2,
//     columns: headers,
//     cast: (columnValue, context) => {
//         if (context.column === 'timestamp') {
//             return parseInt(columnValue);
//         }

//         if (context.column === 'amount') {
//             return parseFloat(columnValue);
//         }
    
//         return columnValue;
//     }
// }, (error, result: Transaction[]) => {
//     if (error) {
//         console.error(error);
//     }
// });

/**
 * Below is the parser of `papaparse` CSV parser library. 
 * It can handle very large files and is very fast.
 */
const parser = parse(NODE_STREAM_INPUT, {
    delimiter: ",",
    header: true,
    dynamicTyping: true,
    fastMode: true,
});

const readableStream = createReadStream(file).pipe(parser);

console.log(`Fetching your portfolio value in ${OUTPUT_CURRENCY}. Please wait...`);

readableStream.on('error', function (error) {
    console.log(`error: ${error.message}`);
})

readableStream.on('data', (transaction: Transaction) => {
    let will_add = true;
    let amount = transaction.amount;
    transaction_count++;

    if(transaction.transaction_type === "WITHDRAWAL") {
        amount = -amount;
    }

    if(options.date) {
        if(transaction.timestamp < time_range.start || transaction.timestamp >= time_range.end) will_add = false;
    }

    if(options.token) {
        let token:string = options.token;
        if(token.toUpperCase() !== transaction.token) will_add = false;
    }

    if(will_add) {
        matched_transaction_count++;

        if(portfolio[transaction.token]) {
            portfolio[transaction.token] = portfolio[transaction.token] + amount;
        } else {
            portfolio[transaction.token] = amount;
        }
    }
});

readableStream.on('end', () => {
    const output: ConsoleResult[] = [];
    if(portfolio && Object.keys(portfolio).length !== 0) {
        get_exchange_rates(Object.keys(portfolio), [OUTPUT_CURRENCY])
        .then( res => {
            const rates = res as ExchangeRate;
            
            for (const [token, value] of Object.entries(portfolio)) {
                output.push(
                    {
                        token: token,
                        value: value * rates[token][OUTPUT_CURRENCY]
                    }
                )
            }
        })
        .then( () => {
            console.table(output);
            console.log(`Matched ${matched_transaction_count} from ${transaction_count} transactions.`); 
            const execution_end = process.hrtime(execution_start);
            console.log(`Took ${(execution_end[0] * 1e9 + execution_end[1])/1e9} seconds`);
        })
        .catch( err => {
            console.error("ERROR: Unable to connect to remote API server. Please check your network connection.");
        });
    } else {
        console.log(`Searched ${transaction_count} transactions.`)
        console.log("Sorry! No match found. Please try with a different token and/or date.");
    }
});
