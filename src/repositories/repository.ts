import { LowdbSync } from "lowdb";
import {
  DatabaseEntity,
  ThreadEntity_MainThread,
  ThreadEntity_ThreadImage,
  ThreadEntity_ThreadReply,
} from "../types/entities";
import { ThreadPostRequest, ThreadResponse } from "../types/models/thread";
import { FavoriteResponse } from "../types/models/favorite/Response";
import CommonUtils from "../utils/common";
import { commonPath } from "../constants";
import {
  LoginResponse,
  UserReplies,
  UserRepliesResponse,
  UserResponse,
} from "../types/models/user/Response";
import { LoginRequest } from "../types/models/user/Request";

export class Repository {
  db: LowdbSync<DatabaseEntity>; // Type declare for `this.db`
  constructor(db: LowdbSync<DatabaseEntity>) {
    this.db = db;
  }

  // 1.1. Get user by userId
  getUserById(userId: number): UserResponse | undefined {
    const user = this.db.get("users").value()[userId];
    if (user) {
      const images = this.db.get("resources").value()["images"];
      const avatarURL = images[user.imageId]!;
      const userResponse: UserResponse = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarURL: avatarURL,
      };
      return userResponse;
    }
    return undefined;
  }

  userLoginAuthentication(loginRequest: LoginRequest): LoginResponse {
    const userId = this.db.get("usernames").value()[loginRequest.username];
    if (userId) {
      const password = this.db.get("users").value()[userId]?.password;
      if (loginRequest.password === password) {
        return {
          user: this.getUserById(userId),
          message: undefined,
        };
      }
    }
    return {
      user: undefined,
      message: "Username or password is incorrect",
    };
  }

  // 2.1. Get a Thread by threadId
  getThreadById(threadId: number, userId: number): ThreadResponse | undefined {
    const thread = this.db.get("threads").value()["threads"][threadId];

    if (thread) {
      const replyCount = Object.keys(thread.threadReplies).length;
      const imageURLs = this.getImageURLs(...Object.keys(thread.images));

      return {
        content: thread.mainThread,
        user: this.getUserById(thread.mainThread.userId)!, // Thread owner
        favorite: this.getThreadFavoriteStatus(threadId, userId),
        replyCount: replyCount,
        imageURLs: imageURLs,
        dateTime: {
          createdAt: thread.dateTime.createdAt,
          updatedAt: thread.dateTime.updatedAt,
        },
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
      const userId = threads[threadId]!.mainThread.userId;

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

        // 1. Check if randomThreadId is already watched by user
        // 2. Check if randomThreadId is a reply to another Thread
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
    const { imageIds, ...mainThread } = newThreadRequest;

    // Create images object
    const images: ThreadEntity_ThreadImage = {};
    imageIds?.forEach((id) => {
      images[id] = true;
    });

    const newThread: ThreadEntity_MainThread = {
      mainThread: {
        id: newThreadId,
        ...mainThread,
      },
      threadReplies: {},
      images: images,
      ...CommonUtils.getCurrentDate(),
    };

    // Add new data to the object
    threads[newThreadId] = newThread;
    // Handle first Thread of the user
    if (!users[threadOwnerId]) {
      users[threadOwnerId] = {};
    }
    users[threadOwnerId]![newThreadId] = CommonUtils.getCurrentDate();

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

    // Handle if Thread has no favorites
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

  // 2.7. Get a Thread reply
  getThreadReplyById(
    threadReplyId: number,
    userId: number
  ): ThreadResponse | undefined {
    const threadReplies = this.db.get("threads").value()["threadReplies"];
    const threadReply = threadReplies[threadReplyId];
    if (threadReply) {
      // const user = this.db.get("users").value()[threadReply.threadReply.userId];
      const user = this.getUserById(threadReply.threadReply.userId);

      if (user) {
        const replyCount = Object.keys(
          threadReply.threadReplyingReplies
        ).length;
        const imageURLs = this.getImageURLs(...Object.keys(threadReply.images));
        return {
          content: threadReply.threadReply,
          user: user,
          favorite: this.getThreadReplyFavoriteStatus(threadReplyId, userId),
          replyCount: replyCount,
          imageURLs: imageURLs,
          dateTime: {
            createdAt: threadReply.dateTime.createdAt,
            updatedAt: threadReply.dateTime.updatedAt,
          },
        };
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  // 2.8. Get Thread reply favorite status
  getThreadReplyFavoriteStatus(
    threadReplyId: number,
    userId: number
  ): FavoriteResponse {
    // Get the list of user ID who favorite this thread reply which has threadReplyId
    const userIds = this.db.get("favoriteThreads").value()["threadReplies"][
      threadReplyId
    ];

    // Get number of favorite by number of keys
    const favoriteCount = userIds ? Object.keys(userIds).length : 0;

    // If there is a legal value === userId that means this Thread has been favorited by user which has userId
    const isFavorite = userIds ? userIds[userId] || false : false;

    return {
      favoriteCount,
      isFavorite,
    };
  }

  // 2.9. Get Thread replies by mainThreadId
  getThreadReplies(
    mainThreadId: number,
    userId: number
  ): ThreadResponse[] | undefined {
    const threadResponses: ThreadResponse[] = [];

    const mainThread = this.db.get("threads").value()["threads"][mainThreadId];

    if (mainThread) {
      const threadReplyIdList = Object.keys(mainThread["threadReplies"]);
      threadReplyIdList.forEach((threadReplyId) => {
        const threadResponse = this.getThreadReplyById(
          Number(threadReplyId),
          userId
        );
        threadResponses.push(threadResponse!);
      });
      return threadResponses;
    } else {
      return undefined;
    }
  }

  // 2.10. Get Thread details
  // Include: Thread's replies
  getThreadDetails(mainThreadId: number, userId: number): ThreadResponse[] {
    const threadReplies = this.getThreadReplies(mainThreadId, userId)!;
    return threadReplies;
  }

  // 2.11. Favorite
  favoriteThreadReply(
    threadReplyId: number,
    userId: number,
    isFavorite: boolean
  ): boolean {
    const threadReply = this.db.get("threads").value()["threadReplies"][
      threadReplyId
    ];
    const user = this.db.get("users").value()[userId];

    // Check existing, pass if Thread reply and user existing
    if (!threadReply || !user) {
      return false;
    }

    const favoriteThreadReplies = this.db.get("favoriteThreads").value()[
      "threadReplies"
    ];
    const favoriteThreadReplyUsers = this.db.get("favoriteThreads").value()[
      "threadReplyUsers"
    ];

    // Handle if Thread reply has no favorites
    if (!favoriteThreadReplies[threadReplyId]) {
      favoriteThreadReplies[threadReplyId] = {};
    }
    // Handle if User has never favorite a Thread reply yet
    if (!favoriteThreadReplyUsers[userId]) {
      favoriteThreadReplyUsers[userId] = {};
    }

    // Handle favorite or unfavorite
    if (isFavorite) {
      // Favorite
      favoriteThreadReplies[threadReplyId]![userId] = true;
      favoriteThreadReplyUsers[userId]![threadReplyId] = true;
    } else {
      // Unfavorite
      delete favoriteThreadReplies[threadReplyId]![userId];
      delete favoriteThreadReplyUsers[userId]![threadReplyId];
    }

    // Sync to the database
    this.db.write();

    // Final operation
    return true;
  }

  // 2.12. Post Thread reply
  postThreadReply(newThreadRequest: ThreadPostRequest): boolean {
    // Get data from database for sync later
    const threads = this.db.get("threads").value()["threads"];
    const threadReplies = this.db.get("threads").value()["threadReplies"];
    const threadReplyUsers = this.db.get("threads").value()["threadReplyUsers"];

    // Generate new ID for new Thread Reply
    const newThreadReplyId = CommonUtils.generateId(threadReplies);
    const threadOwnerId = newThreadRequest.userId;
    const { imageIds, ...threadReply } = newThreadRequest;

    // Create images object
    const images: ThreadEntity_ThreadImage = {};
    imageIds?.forEach((id) => {
      images[id] = true;
    });

    // New Thread reply object
    const newThreadReply: ThreadEntity_ThreadReply = {
      threadReply: {
        id: newThreadReplyId,
        ...threadReply,
      },
      threadReplyingReplies: {},
      images: images,
      ...CommonUtils.getCurrentDate(),
    };

    // Add new data to the object
    threadReplies[newThreadReplyId] = newThreadReply;

    // Handle if the user has never replied to any Thread
    if (!threadReplyUsers[threadOwnerId]) {
      threadReplyUsers[threadOwnerId] = {};
    }
    // Handle if the user has never replied to the current Main Thread
    if (
      !threadReplyUsers[threadOwnerId]![
        newThreadReply.threadReply.mainThreadId!
      ]
    ) {
      threadReplyUsers[threadOwnerId]![
        newThreadReply.threadReply.mainThreadId!
      ] = {};
    }
    threadReplyUsers[threadOwnerId]![newThreadReply.threadReply.mainThreadId!]![
      newThreadReplyId
    ] = CommonUtils.getCurrentDate();

    // Add new Thread reply ID to main Thread object
    threads[newThreadReply.threadReply.mainThreadId!]!["threadReplies"][
      newThreadReply.threadReply.id
    ] = true;

    // Write data to the database (sync to the database)
    this.db.write();

    return true;
  }

  // 2.13. Upload images
  uploadImages(fileList: Express.Multer.File[]): number[] {
    const imageIds: number[] = [];

    const images = this.db.get("resources").value()["images"];
    let newImageId = CommonUtils.generateId(images);

    fileList.forEach((file) => {
      imageIds.push(newImageId);

      const imageURL = commonPath.getImageUrl(file.filename);
      images[newImageId] = imageURL;
      newImageId += 1;
    });
    this.db.write();

    return imageIds;
  }

  // 2.14. Get image URLs by image ID
  getImageURLs(...imageIds: number[] | string[]): string[] {
    const imageURLs = this.db.get("resources").value()["images"];

    return imageIds.map((id) => imageURLs[Number(id)]!);
  }

  // 2.15. Get all Threads by User Id
  getThreadsByUserId(userId: number): ThreadResponse[] {
    const threadResponses: ThreadResponse[] = [];
    const threadIds = this.db.get("threads").value()["users"][userId];
    if (threadIds) {
      const threadIdList = Object.keys(threadIds);
      threadIdList.forEach((threadId) => {
        const threadResponse = this.getThreadById(Number(threadId), userId)!;
        threadResponses.push(threadResponse);
      });
    }
    threadResponses.sort((a, b) => b.dateTime.createdAt - a.dateTime.createdAt);
    return threadResponses;
  }

  // 2.16. Get Thread Replies by User Id
  getUserReplies(userId: number, mainThreadId: number): UserReplies {
    const mainThread = this.getThreadById(mainThreadId, userId)!;

    const userReplies: UserReplies = {
      mainThread: mainThread,
      threadReplies: [],
    };

    const threadReplyIds = this.db.get("threads").value()["threadReplyUsers"][
      userId
    ]![mainThreadId];

    if (threadReplyIds) {
      const replyIdList = Object.keys(threadReplyIds);
      replyIdList.forEach((threadReplyId) => {
        const threadReply = this.getThreadReplyById(
          Number(threadReplyId),
          userId
        )!;
        userReplies.threadReplies.push(threadReply);
      });
    }

    userReplies.threadReplies.sort(
      (a, b) => b.dateTime.createdAt - a.dateTime.createdAt
    );
    return userReplies;
  }

  // 2.17. Get all Thread Replies by User Id
  getAllUserReplies(userId: number): UserRepliesResponse {
    const userRepliesResponse: UserRepliesResponse = [];

    const mainThreadIds = this.db.get("threads").value()["threadReplyUsers"][
      userId
    ];

    if (mainThreadIds) {
      const mainThreadIdList = Object.keys(mainThreadIds);
      mainThreadIdList.forEach((mainThreadId) => {
        const userReplies = this.getUserReplies(userId, Number(mainThreadId));
        userRepliesResponse.push(userReplies);
      });
    }

    userRepliesResponse.sort(
      (a, b) =>
        b.threadReplies[0].dateTime.createdAt -
        a.threadReplies[0].dateTime.createdAt
    );
    return userRepliesResponse;
  }
}
