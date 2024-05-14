export type FavoriteThreadEntity = {
  threads: FavoriteThreadEntity_Threads;
  threadReplies: FavoriteThreadEntity_ThreadReplies;
  threadReplyingReplies: FavoriteThreadEntity_ThreadReplyingReplies;
  users: FavoriteThreadEntity_Users;
  threadReplyUsers: FavoriteThreadEntity_ThreadReplyUsers;
};

// ----- Thread
export type FavoriteThreadEntity_Thread = {
  [userId: number]: true | undefined;
};

// Contains userIds who liked this threadId post
export type FavoriteThreadEntity_Threads = {
  [threadId: number]: FavoriteThreadEntity_Thread | undefined;
};

// ----- Thread Reply
export type FavoriteThreadEntity_ThreadReplies = {
  [threadReplyId: number]: FavoriteThreadEntity_Thread;
};

// ----- Thread Replying Reply
export type FavoriteThreadEntity_ThreadReplyingReplies = {
  [threadReplyingReplyId: number]: FavoriteThreadEntity_Thread;
};

// ----- User
export type FavoriteThreadEntity_User = {
  [threadId: number]: true | undefined;
};

// Contains threadIds which were liked by userId
export type FavoriteThreadEntity_Users = {
  [userId: number]: FavoriteThreadEntity_User | undefined;
};

// ----- Thread Reply User
export type FavoriteThreadEntity_ThreadReplyUser = {
  [threadReplyId: number]: true | undefined;
};

export type FavoriteThreadEntity_ThreadReplyUsers = {
  [userId: number]: FavoriteThreadEntity_ThreadReplyUser | undefined;
};
