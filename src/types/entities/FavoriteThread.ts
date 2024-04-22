export type FavoriteThreadEntity = {
  threads: FavoriteThreadEntity_Threads;
  users: FavoriteThreadEntity_Users;
};

// ----- Thread
export type FavoriteThreadEntity_Thread = {
  [userId: number]: true | undefined;
};

// Contains userIds who liked this threadId post
export type FavoriteThreadEntity_Threads = {
  [threadId: number]: FavoriteThreadEntity_Thread | undefined;
};

// ----- User
export type FavoriteThreadEntity_User = {
  [threadId: number]: true | undefined;
};

// Contains threadIds which were liked by userId
export type FavoriteThreadEntity_Users = {
  [userId: number]: FavoriteThreadEntity_User | undefined;
};
