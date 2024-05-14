import { ThreadEntity } from "./Thread";
import { FavoriteThreadEntity } from "./FavoriteThread";
import { UserEntity } from "./User";
import { WatchedThreadEntity } from "./WatchedThread";
import { ResourceEntity } from "./Resource";
import { UsernameEntity } from "./Username";

export type DatabaseEntity = {
  usernames: UsernameEntity;
  users: UserEntity;
  threads: ThreadEntity;
  favoriteThreads: FavoriteThreadEntity;
  watchedThreads: WatchedThreadEntity;
  resources: ResourceEntity;
};
