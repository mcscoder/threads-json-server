import { LowdbSync } from "lowdb";
import { DatabaseEntity, ThreadEntity, UserEntity } from "../types/entities";
import { ThreadPostRequest, ThreadPostResponse } from "../types/models/thread";
import CommonUtils from "../utils/common";
import { FavoriteResponse } from "../types/models/favorite/Response";
import { FavoriteThreadEntity } from "../types/entities/FavoriteThread";

export class Repository {
  db: LowdbSync<DatabaseEntity>; // Type declare for `this.db`
  constructor(db: LowdbSync<DatabaseEntity>) {
    this.db = db;
  }

  // 1.1. Get all users
  getAllUsers(): UserEntity[] {
    return this.db.get("users").value();
  }

  // 1.2. Get user by id
  getUserById(userId: number): UserEntity {
    return this.db
      .get("users")
      .find(({ id }) => id === userId)
      .value();
  }

  // 2.1. Get all threads
  getAllThreads(): ThreadPostResponse[] {
    const threadPostResponses: ThreadPostResponse[] = [];
    this.db
      .get("threads")
      .value()
      .forEach((thread) => {
        threadPostResponses.push({
          content: thread,
          user: this.getUserById(thread.userId),
          favorite: this.getFavorite(thread.id, thread.userId),
        });
      });

    return threadPostResponses;
  }

  // 2.2. Post a thread
  addThread(thread: ThreadPostRequest): void {
    const newThreadEntity: ThreadEntity = {
      id: CommonUtils.generateId(this.db.get("threads").value()),
      ...thread,
    };
    this.db.get("threads").push(newThreadEntity).write();
  }

  // 2.3. Mark favorite a thread
  getFavorite(threadId: number, userId: number): FavoriteResponse {
    const threadFavorites: FavoriteThreadEntity[] = this.db
      .get("favoriteThreads")
      .value();
    const favoriteResponse: FavoriteResponse = {
      favoriteCount: 0,
      isFavorite: false,
    };
    threadFavorites.forEach((threadFavorite) => {
      if (threadFavorite.userId === userId) {
        favoriteResponse.isFavorite = true;
      }
      if (threadFavorite.threadId === threadId) {
        favoriteResponse.favoriteCount += 1;
      }
    });
    return favoriteResponse;
  }

  // 2.4. Get a thread
  getThread(threadId: number, userId: number): ThreadPostResponse {
    const thread: ThreadEntity = this.db
      .get("threads")
      .find(({ id }) => id === threadId)
      .value();
    const threadOwner: UserEntity = this.db
      .get("users")
      .find(({ id }) => id === userId)
      .value();
    return {
      content: thread,
      user: threadOwner,
      favorite: this.getFavorite(threadId, userId),
    };
  }

  // 2.4. Get a random thread
  getRandomThread(userId: number): ThreadPostResponse {
    const allThread: ThreadEntity[] = this.db.get("threads").value();
    const randomThreadId: number =
      allThread[Math.floor(Math.random() * allThread.length)].id;

    return this.getThread(randomThreadId, userId);
  }

  // 2.5. Get a list of random
  getRandomThreads(userId: number, count: number): ThreadPostResponse[] {
    const randomThreads: ThreadPostResponse[] = [];
    for (let i = 0; i < count; i++) {
      randomThreads.push(this.getRandomThread(userId));
    }
    return randomThreads;
  }
}
