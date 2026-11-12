// lib/api/index.ts
import { ApiClient } from "./contract";
import { createMockClient } from "./mock";
import { createHttpClient } from "./http";

const MODE = (process.env.NEXT_PUBLIC_API_MODE ?? "mock").toLowerCase();
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

let instance: ApiClient | null = null;

export function getApi(): ApiClient {
  if (instance) return instance;
  instance = MODE === "http" ? createHttpClient(BASE) : createMockClient();
  return instance;
}

export { ApiError } from "./contract";