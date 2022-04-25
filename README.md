# Crypto Portfolio Checker

## Intro
Let us assume you are a crypto investor. You have made transactions over a period of time which is logged in a [CSV file](https://s3-ap-southeast-1.amazonaws.com/static.propine.com/transactions.csv.zip). This command line program does the following

 - Given no parameters, return the latest portfolio value per token in USD
 - Given a token, return the latest portfolio value for that token in USD
 - Given a date, return the portfolio value per token in USD on that date
 - Given a date and a token, return the portfolio value of that token in USD on that date

The CSV file has the following columns
 - timestamp: Integer number of seconds since the Epoch
 - transaction_type: Either a DEPOSIT or a WITHDRAWAL
 - token: The token symbol
 - amount: The amount transacted

Portfolio means the balance of the token where you need to add deposits and subtract withdrawals. The exchange rates are obtained from [cryptocompare](https://min-api.cryptocompare.com/). 

## Pre-requisites
This CLI tool is build with `TypeScript` and runs on `Node`. To run this we will need the following.
 - Node v14 or later
 - NPM

## How to run the program in Linux
 1. Clone the repository
 1. `cd <project_directory>`
 1. Run `cp .env.sample .env` command
 1. Put proper values in `.env` file
 1. Run `npm install` command
 1. Run `npm run build` command
 1. run `npm link` command
 1. Now you can run `crypto-checker` command

## CLI Tool 
The `crypto-checker` CLI tool will read from a CSV file where the transaction records are stored. The CSV file path is the required argument for the command.
```shell
$ crypto-checker <path_to_csv_file> 
```
The tool has 2 more options. 
1. `--token` or `-t` which takes a crypto token for value
2. `--date` or `-d` which take a date in `dd/mm/yyyy` or `yyyy-mm-dd` format

Below is the output for this command for the given CSV file with 30000000 rows.
```shell
$ crypto-checker ~/transactions.csv
```
![Sample Output](./sample_output.png)
```shell
$ crypto-checker ~/transactions.csv --token BTC --date 20/10/2019
```
![Sample Output](./sample_output2.png)

## Solution Design
### Challege
The CLI tool is a simple application that reads from a CSV file and calulates the 
output based on some options or filters. But the main challenge of designing the 
solution is the size of the input CSV file. For a small or medium sized file the 
application can load the full file into memory and work with that. But for a large 
file it is not possible to load the full file into memory. 

### Solution Approach
To solve this challenge the `StreamReader` of `fs` module of `Node` has been used 
to stream the file per row. 

Still the application was not able to parse the large file with `csv-parse` and 
`csv-parser` packages. Then the [papaparse](https://www.papaparse.com/) package 
has been used to stream and parse the large CSV file and aggregate the values in 
an object. After the full file has been processed only a small object is returned 
to do further calculations. 

### Minimal External API Calls
To get the exchange rates of the crypto currencies the CrtyptoCompare API has been 
used. But the API is called only once per execution of the script. Also the API key 
is taken from `.env` file to keep the key safe from version control system.

Though the large file takes relatively long time to process the application does 
not crash or fail to parse the file if it has the proper format and data. 