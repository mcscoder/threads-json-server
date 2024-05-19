import { ExistOrNot } from "./Common";

export type FavoriteThreadEntity = {
  threads: FavoriteThreadEntity_Threads;
  threadReplies: FavoriteThreadEntity_ThreadReplies;
  threadReplyingReplies: FavoriteThreadEntity_ThreadReplyingReplies;
  users: FavoriteThreadEntity_Users;
  threadReplyUsers: FavoriteThreadEntity_ThreadReplyUsers;
  threadReplyingReplyUsers: FavoriteThreadEntity_ThreadReplyingReplyUsers;
};

// ----- Thread
export type FavoriteThreadEntity_Threads = {
  [threadId: number]: ExistOrNot<{
    [userId: number]: ExistOrNot<true>;
  }>;
};

// ----- Thread Reply
export type FavoriteThreadEntity_ThreadReplies = {
  [threadReplyId: number]: ExistOrNot<{
    [userId: number]: ExistOrNot<true>;
  }>;
};

// ----- Thread Replying Reply
export type FavoriteThreadEntity_ThreadReplyingReplies = {
  [threadReplyingReplyId: number]: ExistOrNot<{
    [userId: number]: ExistOrNot<true>;
  }>;
};

// ----- User
export type FavoriteThreadEntity_Users = {
  [userId: number]: ExistOrNot<{
    [threadId: number]: ExistOrNot<true>;
  }>;
};

// ----- Thread Reply User
export type FavoriteThreadEntity_ThreadReplyUsers = {
  [userId: number]: ExistOrNot<{
    [threadReplyId: number]: ExistOrNot<true>;
  }>;
};

// ----- Thread Replying Reply User
export type FavoriteThreadEntity_ThreadReplyingReplyUsers = {
  [userId: number]: ExistOrNot<{
    [threadReplyingReplyId: number]: ExistOrNot<true>;
  }>;
};
