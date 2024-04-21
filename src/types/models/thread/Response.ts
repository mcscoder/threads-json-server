import { ThreadEntity, UserEntity } from "../../entities";
import { FavoriteResponse } from "../favorite/Response";

export type ThreadPostResponse = {
  content: ThreadEntity;
  user: UserEntity; // owner post
  favorite: FavoriteResponse;
};
