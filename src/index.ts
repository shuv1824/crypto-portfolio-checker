#! /usr/bin/node

import { createReadStream } from "fs";
import { parse } from 'csv-parse';
import { Command } from 'commander';
import { Transaction } from './types/transaction';

const program = new Command();

program
    .argument('<file>', 'Path of the CSV file with crypto investment transaction data.')
    .option('-t, --token <type>', 'The token for which latest portfolio will be given.')
    .option('-d, --date <type>', 'The date on which portfolio for each token will be given.');

program.parse();

const [file] = program.args;
const options = program.opts();

interface Portfolio {
    [key: string]: number
}

const portfolio:Portfolio = {}

const headers = ['timestamp', 'transaction_type', 'token', 'amount'];

const parser = parse({
    delimiter: ',',
    encoding: 'utf-8',
    from_line: 2,
    columns: headers,
    cast: (columnValue, context) => {
        if (context.column === 'timestamp') {
            return parseInt(columnValue);
        }

        if (context.column === 'amount') {
            return parseFloat(columnValue);
        }
    
        return columnValue;
    }
}, (error, result: Transaction[]) => {
    if (error) {
        console.error(error);
    }
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
