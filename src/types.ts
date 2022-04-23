
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
