import { ThreadEntity_Thread } from "../../entities";

export type ThreadPostRequest = Pick<
  ThreadEntity_Thread,
  "post" | "text" | "mainThreadId" | "userId"
>;
