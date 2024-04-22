import { ThreadEntity } from "./Thread";
import { FavoriteThreadEntity } from "./FavoriteThread";
import { UserEntity } from "./User";
import { WatchedThreadEntity } from "./WatchedThread";

export type DatabaseEntity = {
  users: UserEntity;
  threads: ThreadEntity;
  favoriteThreads: FavoriteThreadEntity;
  watchedThreads: WatchedThreadEntity;
};
