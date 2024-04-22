export type UserEntity = {
  [id: number]: UserEntity_User | undefined;
};

// ----- User
export type UserEntity_User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  avatarURL: string;
};
