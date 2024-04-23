import { LowdbSync } from "lowdb";
import {
  DatabaseEntity,
  ThreadEntity_Thread,
  UserEntity_User,
} from "../types/entities";
import { ThreadPostRequest, ThreadResponse } from "../types/models/thread";
import { FavoriteResponse } from "../types/models/favorite/Response";
import CommonUtils from "../utils/common";

export class Repository {
  db: LowdbSync<DatabaseEntity>; // Type declare for `this.db`
  constructor(db: LowdbSync<DatabaseEntity>) {
    this.db = db;
  }

  // 1.1. Get user by userId
  getUserById(userId: number): UserEntity_User | undefined {
    const user = this.db.get("users").value()[userId];
    return user;
  }

  // 2.1. Get a Thread by threadId
  getThreadById(threadId: number, userId: number): ThreadResponse | undefined {
    const thread = this.db.get("threads").value()["threads"][threadId];

    if (thread) {
      return {
        content: thread,
        user: this.getUserById(thread.userId)!, // Thread owner
        favorite: this.getThreadFavoriteStatus(threadId, userId),
      };
    }
    return undefined;
  }

  // 2.2. Delete a Thread by threadId
  deleteThreadById(threadId: number): boolean {
    // Get all Threads
    const threads = this.db.get("threads").value()["threads"];

    // Check if threadId exist
    if (threads[threadId]) {
      // Thread owner id (userId)
      const userId = threads[threadId]!.userId;

      // Get the list of threadIds of the user who is the owner of the Thread that needs to be deleted
      const users = this.db.get("threads").value()["users"][userId]!;

      // Delete threadId out of threadIds list and Thread
      delete users[threadId];
      delete threads[threadId];

      // Write the modified data to the database
      this.db.write();

      return true;
    }
    return false;
  }

  // 2.3. Get Thread favorite
  getThreadFavoriteStatus(threadId: number, userId: number): FavoriteResponse {
    // Get list of userId who favorites the Thread with id = threadId
    const userIds = this.db.get("favoriteThreads").value()["threads"][threadId];

    // Get number of favorite by number of keys
    const favoriteCount = userIds ? Object.keys(userIds).length : 0;
    // If one of the keys === userId that means this Thread has been favorited by user
    const isFavorite = userIds ? userIds[userId] || false : false;

    return {
      favoriteCount,
      isFavorite,
    };
  }

  // 2.4. Get random Threads
  getRandomThreads(userId: number, count: number): ThreadResponse[] {
    const threadResponse: ThreadResponse[] = [];

    // Handle if user id in watched Threads is not initialized yet
    const watchedThreadUserIds = this.db.get("watchedThreads").value()["users"];
    if (!watchedThreadUserIds[userId]) {
      watchedThreadUserIds[userId] = {};
    }

    // Get all watched Thread ids of a user with userId provided
    const watchedThreadIds = watchedThreadUserIds[userId]!;

    // Get all Threads
    const allThreads = { ...this.db.get("threads").value()["threads"] };

    // Filter and remove watched Thread out of allThread
    Object.keys(watchedThreadIds).forEach((watchedThreadId) => {
      delete allThreads[Number(watchedThreadId)];
    });

    // Get unwatched Thread ids from allThreads after remove all of watched Thread ids
    const unwatchedThreadIds = Object.keys(allThreads);

    // Start random and picking
    for (let i = 0; i < Math.min(count, unwatchedThreadIds.length); i++) {
      let finalThreadId: number | false = false;
      while (!finalThreadId) {
        const randomIndex = Math.floor(
          Math.random() * unwatchedThreadIds.length
        );
        const randomThreadId = Number(unwatchedThreadIds[randomIndex]);

        // Check if randomThreadId is already watched by user
        if (!watchedThreadIds[randomThreadId]) {
          finalThreadId = randomThreadId;
        }
      }
      threadResponse.push(this.getThreadById(finalThreadId, userId)!);
      // watchedThreadIds[finalThreadId] = true;
    }

    this.db.write();

    return threadResponse;

    // Remember, the `Object.keys` operation is not cheap for frequently using
    // It's cost O(n)
  }

  // 2.5. Post a Thread
  postThread(newThreadRequest: ThreadPostRequest): boolean {
    // Get data from database for sync database later purpose
    const threads = this.db.get("threads").value()["threads"];
    const users = this.db.get("threads").value()["users"];

    // Generate new ID for new Thread
    const newThreadId = CommonUtils.generateId(threads);
    const threadOwnerId = newThreadRequest.userId;

    const newThread: ThreadEntity_Thread = {
      id: newThreadId,
      ...newThreadRequest,
    };

    // Add new data to the object
    threads[newThreadId] = newThread;
    // Handle first Thread of the user
    if (users[threadOwnerId]) {
      users[threadOwnerId]![newThreadId] = true;
    } else {
      users[threadOwnerId] = {};
      users[threadOwnerId]![newThreadId] = true;
    }

    // Write data to the database (sync to the database)
    this.db.write();

    return true;
  }

  // 2.6. Mark favorite a Thread
  favoriteThread(
    threadId: number,
    userId: number,
    isFavorite: boolean
  ): boolean {
    const thread = this.db.get("threads").value()["threads"][threadId];
    const user = this.db.get("users").value()[userId];

    // Check existing, pass if Thread and User is existing
    if (!thread || !user) {
      return false;
    }

    const favoriteThreads = this.db.get("favoriteThreads").value()["threads"];
    const favoriteThreadUsers = this.db.get("favoriteThreads").value()["users"];

    // Handle if Thread has no favorite
    if (!favoriteThreads[threadId]) {
      favoriteThreads[threadId] = {};
    }
    // Handle if User has never favorited a Thread yet
    if (!favoriteThreadUsers[userId]) {
      favoriteThreadUsers[userId] = {};
    }

    // Handle favorite or unfavorite
    if (isFavorite) {
      // Favorite
      favoriteThreads[threadId]![userId] = true;
      favoriteThreadUsers[userId]![threadId] = true;
    } else {
      // Unfavorite
      delete favoriteThreads[threadId]![userId];
      delete favoriteThreadUsers[userId]![threadId];
    }

    // Sync to the database
    this.db.write();

    // Final operation
    return true;
  }
}
