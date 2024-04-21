import { ThreadEntity } from "../../entities";

export type ThreadPostRequest = Pick<
  ThreadEntity,
  "text" | "post" | "mainThreadId" | "userId"
>;
