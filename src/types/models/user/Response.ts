import { UserEntity_User } from "../../entities";
import { ThreadResponse } from "../thread";

export type UserResponse = Pick<
  UserEntity_User,
  "id" | "username" | "firstName" | "lastName"
> & {
  avatarURL: string;
  following: boolean;
  followers: number;
};

export type UserReplies = {
  mainThread: ThreadResponse;
  threadReplies: ThreadResponse[];
};

export type UserRepliesResponse = UserReplies[];

export type LoginResponse = {
  user: UserResponse | undefined;
  message: string | undefined;
};
