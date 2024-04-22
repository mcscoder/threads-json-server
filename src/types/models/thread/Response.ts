import { ThreadEntity_Thread, UserEntity_User } from "../../entities";
import { FavoriteResponse } from "../favorite/Response";

export type ThreadResponse = {
  content: ThreadEntity_Thread;
  user: UserEntity_User; // owner post
  favorite: FavoriteResponse;
};
