import { DateTime, ExistOrNot } from "./Common";

export type FollowEntity = {
  followings: FollowEntityData;
  followers: FollowEntityData;
};

export type FollowEntityData = {
  [currentUserId: number]: ExistOrNot<{
    [otherUserId: number]: ExistOrNot<DateTime>;
  }>;
};

/**
There are two used cases

1. Following.
- @constant otherUserId are users those who followed by @constant currentUserId

2. Follower.
- @constant otherUserId are users those who following by @constant currentUserId
*/
