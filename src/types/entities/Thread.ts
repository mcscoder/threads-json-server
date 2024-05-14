import { DateTime } from "./Common";

export type ThreadEntity = {
  threads: ThreadEntity_Threads;
  users: ThreadEntity_Users;
  threadReplies: ThreadEntity_ThreadReplies;
  threadReplyReplies: ThreadEntity_ThreadReplyingReplies;
  threadReplyUsers: ThreadEntity_ThreadReplyUsers;
};

export type ThreadEntity_Thread = {
  id: number;
  text: string | undefined;
  mainThreadId: number | undefined;
  threadReplyId: number | undefined;
  userId: number;
};

export type ThreadEntity_ThreadImage = {
  [imageId: number]: true | undefined;
};

// ----- Main Thread
export type ThreadEntity_MainThreadReply = {
  [threadReplyId: number]: true | undefined;
};

export type ThreadEntity_MainThread = {
  mainThread: ThreadEntity_Thread;
  threadReplies: ThreadEntity_MainThreadReply;
  images: ThreadEntity_ThreadImage;
} & DateTime;

export type ThreadEntity_Threads = {
  [threadId: number]: ThreadEntity_MainThread | undefined;
};

// ----- Thread Reply
export type ThreadEntity_ThreadReplyingReply = {
  [threadReplyingReplyId: number]: true | undefined;
};

export type ThreadEntity_ThreadReply = {
  threadReply: ThreadEntity_Thread;
  threadReplyingReplies: ThreadEntity_ThreadReplyingReply;
  images: ThreadEntity_ThreadImage;
} & DateTime;

export type ThreadEntity_ThreadReplies = {
  [threadReplyId: number]: ThreadEntity_ThreadReply | undefined;
};

// ----- Thread Replying Replies
export type ThreadEntity_ThreadReplyingReplies = {
  [threadReplyingReplyId: number]: ThreadEntity_Thread | undefined;
};

// ----- User
export type ThreadEntity_User = {
  [threadId: number]: DateTime | undefined;
};

export type ThreadEntity_Users = {
  [userId: number]: ThreadEntity_User | undefined;
};

// ----- Thread Reply User
export type ThreadEntity_ThreadReplyMainThread = {
  [threadReplyId: number]: DateTime | undefined;
};

export type ThreadEntity_ThreadReplyUser = {
  [mainThreadId: number]: ThreadEntity_ThreadReplyMainThread | undefined;
};

export type ThreadEntity_ThreadReplyUsers = {
  [userId: number]: ThreadEntity_ThreadReplyUser | undefined;
};
