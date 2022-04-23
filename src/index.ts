#! /usr/bin/node

import { createReadStream } from "fs";
// import { parse as csv_parse } from 'csv-parse';
import { parse, NODE_STREAM_INPUT } from 'papaparse';
import { Command } from 'commander';
import { Transaction, Portfolio } from './types';

// import { api_key } from './utils'

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

const portfolio:Portfolio = {}

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
    console.log(portfolio);
});
