#! /usr/bin/node

import { createReadStream } from "fs";
// import { parse as csv_parse } from 'csv-parse';
import { parse, NODE_STREAM_INPUT } from 'papaparse';
import { Command } from 'commander';
import { Transaction, Portfolio, ExchangeRate, ConsoleOut } from './types';
import { get_exchange_rates } from './utils';

const program = new Command();

program
    .argument('<file>', 'Path of the CSV file with crypto investment transaction data.')
    .option('-t, --token <type>', 'The token for which latest portfolio will be given.')
    .option('-d, --date <type>', 'The date on which portfolio for each token will be given.');

program.parse();

const [file] = program.args;
const options = program.opts();


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

const portfolio:Portfolio = {};
const OUTPUT_CURRENCY = "USD";

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
    let amount = transaction.amount;

    if(transaction.transaction_type === "WITHDRAWAL") {
        amount = -amount;
    }

    if(options.token) {
        if(options.token === transaction.token) {
            if(portfolio[transaction.token]) {
                portfolio[transaction.token] = portfolio[transaction.token] + amount;
            } else {
                portfolio[transaction.token] = amount;
            }
        }
    } else {
        if(portfolio[transaction.token]) {
            portfolio[transaction.token] = portfolio[transaction.token] + amount;
        } else {
            portfolio[transaction.token] = amount;
        }
    }
});

readableStream.on('end', () => {
    const output: ConsoleOut[] = [];
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
        .then( () => console.table(output));
    } else {
        console.log("Sorry! No token found. Please try with a different token.")
    }
});
