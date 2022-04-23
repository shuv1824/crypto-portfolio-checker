import path from 'path';
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const api_key = process.env.CRYPTOCOMPARE_API_KEY;
