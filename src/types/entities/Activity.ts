import { DateTime, ExistOrNot } from "./Common";

export type ActivityEntity = {
  follows: ActivityEntity_Follows;
  replies: ActivityEntity_Replies;
};

export type ActivityEntity_Follows = {
  [userId: number]: ExistOrNot<{
    [otherUserId: number]: ExistOrNot<DateTime>;
  }>;
};

export enum ReplyType {
  REPLY,
  REPLYING_REPLY,
}

export type ActivityEntity_Reply_User = {
  type: ReplyType;
  replyId: number;
};

export type ActivityEntity_Reply = {
  thisUser: ActivityEntity_Reply_User[];
  otherUsers: ActivityEntity_Reply_User[];
};

export type ActivityEntity_Replies = {
  [userId: number]: ExistOrNot<ActivityEntity_Reply>;
};
