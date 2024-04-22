export type ThreadEntity = {
  threads: ThreadEntity_Threads;
  users: ThreadEntity_Users;
};

// ----- Thread
export type ThreadEntity_Thread = {
  id: number;
  post: boolean;
  text: string | undefined;
  mainThreadId: number | undefined;
  userId: number;
};

export type ThreadEntity_Threads = {
  [threadId: number]: ThreadEntity_Thread | undefined;
};

// ----- User
export type ThreadEntity_User = {
  [threadId: number]: true | undefined;
};

export type ThreadEntity_Users = {
  [userId: number]: ThreadEntity_User | undefined;
};
