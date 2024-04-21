export type ThreadEntity = {
  id: number;
  post: boolean;
  text: string | undefined;
  mainThreadId: number | undefined;
  userId: number;
};
