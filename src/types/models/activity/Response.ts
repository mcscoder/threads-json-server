import { ReplyType } from "../../entities/Activity";
import { ThreadResponse } from "../thread";

export type ReplyActivityResponse = {
  reply: ThreadResponse;
  type: ReplyType;
};
