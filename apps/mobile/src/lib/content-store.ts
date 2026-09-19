export { loadQuestions, loadTopics, saveQuestions } from "./db";
import { SqliteKvStore } from "./db";
const kv = new SqliteKvStore();
export const kvGet = (k: string) => kv.get(k);
export const kvSet = (k: string, v: string) => kv.set(k, v);
