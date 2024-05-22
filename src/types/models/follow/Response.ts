import { DateTime } from "../../entities/Common";
import { UserResponse } from "../user/Response";

export type FollowActivityResponse = {
  user: UserResponse;
} & DateTime;
