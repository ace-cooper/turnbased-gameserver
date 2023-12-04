import { ulid } from "ulid";

export const genId = (timestamp?: number) => ulid(timestamp);