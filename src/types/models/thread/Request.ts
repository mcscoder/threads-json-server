import { ThreadEntity_Thread } from "../../entities";

export type ThreadPostRequest = Pick<
  ThreadEntity_Thread,
  "text" | "mainThreadId" | "threadReplyId" | "userId"
> & {
  imageIds: number[] | undefined;
};
