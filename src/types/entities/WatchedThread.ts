export type WatchedThreadEntity = {
  users: WatchedThreadEntity_Users;
};

export type WatchedThreadEntity_User = {
  [threadId: number]: true | undefined;
};

export type WatchedThreadEntity_Users = {
  [userId: number]: WatchedThreadEntity_User | undefined;
};
