import { ThreadEntity_Thread } from "../../entities";
import { DateTime } from "../../entities/Common";
import { FavoriteResponse } from "../favorite/Response";
import { UserResponse } from "../user/Response";

export type ThreadResponse = {
  content: ThreadEntity_Thread;
  user: UserResponse; // owner post
  favorite: FavoriteResponse;
  replyCount: number;
  imageURLs: string[];
} & DateTime;
