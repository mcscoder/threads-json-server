import { DateTime, ExistOrNot } from "./Common";

export type ThreadEntity = {
  threads: ThreadEntity_Threads;
  threadReplies: ThreadEntity_ThreadReplies;
  threadReplyingReplies: ThreadEntity_ThreadReplyingReplies;
  users: ThreadEntity_Users;
  threadReplyUsers: ThreadEntity_ThreadReplyUsers;
  threadReplyingReplyUsers: ThreadEntity_ThreadReplyingReplyUsers;
};

export type ThreadEntity_Thread = {
  id: number;
  text: string | undefined;
  mainThreadId: number | undefined;
  threadReplyId: number | undefined;
  userId: number;
};

export type ThreadEntity_ThreadImage = {
  [imageId: number]: ExistOrNot<true>;
};

// ----- Main Thread
export type ThreadEntity_MainThread = {
  mainThread: ThreadEntity_Thread;
  threadReplies: { [threadReplyId: number]: ExistOrNot<true> };
  images: ThreadEntity_ThreadImage;
} & DateTime;

export type ThreadEntity_Threads = {
  [threadId: number]: ExistOrNot<ThreadEntity_MainThread>;
};

// ----- Thread Reply
export type ThreadEntity_ThreadReply = {
  threadReply: ThreadEntity_Thread;
  threadReplyingReplies: { [threadReplyingReplyId: number]: ExistOrNot<true> };
  images: ThreadEntity_ThreadImage;
} & DateTime;

export type ThreadEntity_ThreadReplies = {
  [threadReplyId: number]: ExistOrNot<ThreadEntity_ThreadReply>;
};

// ----- Thread Replying Replies
export type ThreadEntity_ThreadReplyingReply = {
  threadReplyingReply: ThreadEntity_Thread;
  images: ThreadEntity_ThreadImage;
} & DateTime;

export type ThreadEntity_ThreadReplyingReplies = {
  [threadReplyingReplyId: number]: ExistOrNot<ThreadEntity_ThreadReplyingReply>;
};

// ----- User
export type ThreadEntity_Users = {
  [userId: number]: ExistOrNot<{
    [threadId: number]: ExistOrNot<DateTime>;
  }>;
};

// ----- Thread Reply User
export type ThreadEntity_ThreadReplyUsers = {
  [userId: number]: ExistOrNot<{
    [mainThreadId: number]: ExistOrNot<{
      [threadReplyId: number]: ExistOrNot<DateTime>;
    }>;
  }>;
};

// ----- Thread Replying Reply User
export type ThreadEntity_ThreadReplyingReplyUsers = {
  [userId: number]: ExistOrNot<{
    [threadReplyId: number]: ExistOrNot<{
      [threadReplyingReplyId: number]: ExistOrNot<DateTime>;
    }>;
  }>;
};
