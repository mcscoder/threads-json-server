import { LowdbSync } from "lowdb";
import {
  DatabaseEntity,
  ThreadEntity_MainThread,
  ThreadEntity_ThreadImage,
  ThreadEntity_ThreadReply,
  ThreadEntity_ThreadReplyingReply,
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
import { ReplyType } from "../types/entities/Activity";

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

  // 1.2. User login authentication
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
    const currentUserId = newThreadRequest.userId;
    const { imageIds, ...threadReply } = newThreadRequest;

    // Create image object
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

    const mainThreadId = newThreadReply.threadReply.mainThreadId!;
    const mainThreadUserId = threads[mainThreadId]!.mainThread.userId;

    // Add new data to the object
    threadReplies[newThreadReplyId] = newThreadReply;

    // Handle if the user has never replied to any Thread
    if (!threadReplyUsers[currentUserId]) {
      threadReplyUsers[currentUserId] = {};
    }
    // Handle if the user has never replied to the current Main Thread
    if (!threadReplyUsers[currentUserId]![mainThreadId]) {
      threadReplyUsers[currentUserId]![mainThreadId] = {};
    }
    // Add date for new Thread reply
    threadReplyUsers[currentUserId]![mainThreadId]![newThreadReplyId] =
      CommonUtils.getCurrentDate();

    // Add new Thread reply ID to main Thread object
    threads[mainThreadId]!["threadReplies"][newThreadReplyId] = true;

    this.setUserReplyActivity(
      currentUserId,
      mainThreadUserId,
      ReplyType.reply,
      newThreadReplyId
    );

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
  getThreadsByUserId(
    profileUserId: number,
    currentUserId: number
  ): ThreadResponse[] {
    const threadResponses: ThreadResponse[] = [];
    const threadIds = this.db.get("threads").value()["users"][profileUserId];
    if (threadIds) {
      const threadIdList = Object.keys(threadIds);
      threadIdList.forEach((threadId) => {
        const threadResponse = this.getThreadById(
          Number(threadId),
          currentUserId
        )!;
        threadResponses.push(threadResponse);
      });
    }
    threadResponses.sort((a, b) => b.dateTime.createdAt - a.dateTime.createdAt);
    return threadResponses;
  }

  // 2.16. Get Thread Replies by User Id
  getRepliesByUser(
    profileUserId: number,
    currentUserId: number,
    mainThreadId: number
  ): UserReplies {
    const mainThread = this.getThreadById(mainThreadId, currentUserId)!;

    const userReplies: UserReplies = {
      mainThread: mainThread,
      threadReplies: [],
    };

    const threadReplyIds = this.db.get("threads").value()["threadReplyUsers"][
      profileUserId
    ]![mainThreadId];

    if (threadReplyIds) {
      const replyIdList = Object.keys(threadReplyIds);
      replyIdList.forEach((threadReplyId) => {
        const threadReply = this.getThreadReplyById(
          Number(threadReplyId),
          currentUserId
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
  getAllRepliesByUser(
    profileUserId: number,
    currentUserId: number
  ): UserRepliesResponse {
    const userRepliesResponse: UserRepliesResponse = [];

    const mainThreads = this.db.get("threads").value()["threadReplyUsers"][
      profileUserId
    ];

    if (mainThreads) {
      const mainThreadIdList = Object.keys(mainThreads);
      mainThreadIdList.forEach((mainThreadId) => {
        const userReplies = this.getRepliesByUser(
          profileUserId,
          currentUserId,
          Number(mainThreadId)
        );
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

  // 2.18. Post reply to another reply
  postThreadReplyingReply(newThreadRequest: ThreadPostRequest): boolean {
    // Get data from database for sync later
    const threadReplies = this.db.get("threads").value()["threadReplies"];
    const threadReplyingReplies = this.db.get("threads").value()[
      "threadReplyingReplies"
    ];
    const threadReplyingReplyUsers = this.db.get("threads").value()[
      "threadReplyingReplyUsers"
    ];

    // Generate new ID for new Thread Replying Reply
    const newThreadReplyingReplyId = CommonUtils.generateId(
      threadReplyingReplies
    );
    const currentUserId = newThreadRequest.userId;
    const { imageIds, ...threadReplyingReply } = newThreadRequest;

    // Create image object
    const images: ThreadEntity_ThreadImage = {};
    imageIds?.forEach((id) => {
      images[id] = true;
    });

    // New Thread Replying Reply object
    const newThreadReplyingReply: ThreadEntity_ThreadReplyingReply = {
      threadReplyingReply: {
        id: newThreadReplyingReplyId,
        ...threadReplyingReply,
      },
      images: images,
      ...CommonUtils.getCurrentDate(),
    };

    const threadReplyId =
      newThreadReplyingReply.threadReplyingReply.threadReplyId!;
    const threadReplyUserId = threadReplies[threadReplyId]!.threadReply.userId;

    // Add new data to the object
    threadReplyingReplies[newThreadReplyingReplyId] = newThreadReplyingReply;

    // Handle if the user has never replied to any Thread's reply
    if (!threadReplyingReplyUsers[currentUserId]) {
      threadReplyingReplyUsers[currentUserId] = {};
    }
    // Handle if the user has never replied to the current Thread's reply
    if (!threadReplyingReplyUsers[currentUserId]![threadReplyId]) {
      threadReplyingReplyUsers[currentUserId]![threadReplyId] = {};
    }
    // Add date for new Thread replying reply
    threadReplyingReplyUsers[currentUserId]![threadReplyId]![
      newThreadReplyingReplyId
    ] = CommonUtils.getCurrentDate();

    // Add new Thread replying reply ID to the Thread Reply object
    threadReplies[threadReplyId]!["threadReplyingReplies"][
      newThreadReplyingReplyId
    ] = true;

    this.setUserReplyActivity(
      currentUserId,
      threadReplyUserId,
      ReplyType.replyingReply,
      newThreadReplyingReplyId
    );

    // Write data to the database (sync to the database)
    this.db.write();

    return true;
  }

  // 2.19. Get Thread Replying Reply favorite status
  getThreadReplyingReplyFavoriteStatus(
    threadReplyingReplyId: number,
    userId: number
  ): FavoriteResponse {
    // Get list of userId who favorited the Thread Replying Reply with id = threadReplyingReplyId
    const userIds = this.db.get("favoriteThreads").value()[
      "threadReplyingReplyUsers"
    ][threadReplyingReplyId];

    // Get number of favorite by number of keys
    const favoriteCount = userIds ? Object.keys(userIds).length : 0;
    // If one of the keys === userId that means this Thread has been favorited by user
    const isFavorite = userIds ? userIds[userId] || false : false;

    return {
      favoriteCount,
      isFavorite,
    };
  }

  // 2.20. Get Thread Replying Reply
  getThreadReplyingReplyById(
    threadReplyingReplyId: number,
    userId: number
  ): ThreadResponse | undefined {
    const threadReplyingReply = this.db.get("threads").value()[
      "threadReplyingReplies"
    ][threadReplyingReplyId];
    const requestedUser = this.getUserById(userId);
    if (threadReplyingReply && requestedUser) {
      const user = this.getUserById(
        threadReplyingReply.threadReplyingReply.userId
      )!;
      const imageURLs = this.getImageURLs(
        ...Object.keys(threadReplyingReply.images)
      );
      const favorite = this.getThreadReplyingReplyFavoriteStatus(
        threadReplyingReplyId,
        userId
      );
      const dateTime = threadReplyingReply.dateTime;
      return {
        content: threadReplyingReply.threadReplyingReply,
        user: user,
        favorite: favorite,
        imageURLs: imageURLs,
        dateTime: dateTime,
        replyCount: undefined,
      };
    }
    return undefined;
  }

  // 2.21. Mark favorite a Thread Replying Reply
  favoriteThreadReplyingReply(
    threadReplyingReplyId: number,
    userId: number,
    isFavorite: boolean
  ): boolean {
    const threadReplyingReply = this.getThreadReplyingReplyById(
      threadReplyingReplyId,
      userId
    );

    // Check existing, pass if Thread reply and user existing
    if (!threadReplyingReply) {
      return false;
    }

    const favoriteThreadReplyingReplies = this.db
      .get("favoriteThreads")
      .value()["threadReplyingReplies"];

    const favoriteThreadReplyingReplyUsers = this.db
      .get("favoriteThreads")
      .value()["threadReplyingReplyUsers"];

    // Handle if Thread Replying Reply has no favorites
    if (!favoriteThreadReplyingReplies[threadReplyingReplyId]) {
      favoriteThreadReplyingReplies[threadReplyingReplyId] = {};
    }
    // Handle if User has never favorite a Thread Replying Reply yet
    if (!favoriteThreadReplyingReplyUsers[userId]) {
      favoriteThreadReplyingReplyUsers[userId] = {};
    }

    // Handle favorite of unfavorite
    if (isFavorite) {
      // Favorite
      favoriteThreadReplyingReplies[threadReplyingReplyId]![userId] = true;
      favoriteThreadReplyingReplyUsers[userId]![threadReplyingReplyId] = true;
    } else {
      // Unfavorite
      delete favoriteThreadReplyingReplies[threadReplyingReplyId]![userId];
      delete favoriteThreadReplyingReplyUsers[userId]![threadReplyingReplyId];
    }

    // Sync to the database
    this.db.write();

    // Final operation
    return true;
  }

  // 2.22. Get Thread Replying Replies
  getThreadReplyingReplies(
    threadReplyId: number,
    currentUserId: number
  ): ThreadResponse[] | undefined {
    const threadReply = this.db.get("threads").value()["threadReplies"][
      threadReplyId
    ];
    if (threadReply) {
      const threadResponses: ThreadResponse[] = [];

      const threadReplyingReplyIdList = Object.keys(
        threadReply["threadReplyingReplies"]
      );
      threadReplyingReplyIdList.forEach((threadReplyingReplyId) => {
        const threadResponse = this.getThreadReplyingReplyById(
          Number(threadReplyingReplyId),
          currentUserId
        )!;
        threadResponses.push(threadResponse);
      });
      return threadResponses;
    }

    return undefined;
  }

  // 3.1. Replies Activity
  setUserReplyActivity(
    currentUserId: number,
    replyToUserId: number,
    type: ReplyType,
    replyId: number
  ): void {
    const replies = this.db.get("activities").value()["replies"];

    // Handle if reply activity of user is empty
    if (!replies[currentUserId]) {
      replies[currentUserId] = {
        thisUser: [],
        otherUsers: [],
      };
    }
    if (!replies[replyToUserId]) {
      replies[replyToUserId] = {
        thisUser: [],
        otherUsers: [],
      };
    }

    const thisUser = replies[currentUserId]!.thisUser;
    thisUser.push({
      type,
      replyId,
    });

    if (currentUserId !== replyToUserId) {
      const otherUsers = replies[replyToUserId]!.otherUsers;
      otherUsers.push({
        type,
        replyId,
      });
    }

    this.db.write();
  }
}
