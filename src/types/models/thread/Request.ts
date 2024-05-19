import { ThreadEntity_Thread } from "../../entities";
import { ExistOrNot } from "../../entities/Common";

export type ThreadPostRequest = Pick<
  ThreadEntity_Thread,
  "text" | "mainThreadId" | "threadReplyId" | "userId"
> & {
  imageIds: ExistOrNot<number[]>;
};
