
type TransactionType = "DEPOSIT" | "WITHDRAWAL";

export type Transaction = {
  timestamp: number;
  transaction_type: TransactionType;
  token: string;
  amount: number;
};

export interface Portfolio {
  [key: string]: number
};

export interface ConsoleResult {
  token: string,
  value: number
}

export interface ExchangeRate {
  [key: string]: {
    [key: string]: number
  }
}

export interface TimeRange {
  start: number,
  end: number
}
