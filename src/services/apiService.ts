import { Application } from "express";
import { Repository } from "../repositories";
import CommonUtils from "../utils/common";
import { ThreadPostRequest } from "../types/models/thread";

export function apiService(server: Application, db: Repository) {
  // 1.1. Get a user by userId
  server.get("/api/user", (req, res) => {
    const userId = req.get("userId");
    res.json(db.getUserById(Number(userId)));
  });

  // 2.1. Get a thread by threadId
  server.get("/api/thread/:threadId", (req, res) => {
    const userId = req.get("userId");
    const threadId = req.params.threadId;
    if (userId) {
      res.json(db.getThreadById(Number(threadId), Number(userId)));
    } else {
      res.json(
        CommonUtils.responseMessage("userId in header is field missing")
      );
    }
  });

  // 2.2. Delete a thread by threadId
  server.delete("/api/thread/:threadId", (req, res) => {
    const threadId = req.params.threadId;
    if (db.deleteThreadById(Number(threadId))) {
      res.json(CommonUtils.responseMessage("Thread has been deleted"));
    } else {
      res.json(CommonUtils.responseMessage("threadId is not exist"));
    }
  });

  // 2.3. Get random Threads
  server.get("/api/thread/random/:count", (req, res) => {
    const userId = req.get("userId");
    const count = req.params.count;

    res.json(db.getRandomThreads(Number(userId), Number(count)));
  });

  // 2.4. Post a Thread
  server.post("/api/thread", (req, res) => {
    const threadRequestBody: ThreadPostRequest = req.body;
    console.log(threadRequestBody);
    const success = db.postThread(threadRequestBody);
    if (success) {
      res.json(CommonUtils.responseMessage("Thread has been posted"));
    }
  });

  // 2.5. Favorite a Thread
  server.get("/api/thread/favorite/:threadId", (req, res) => {
    const { threadId } = req.params;
    const { isFavorite } = req.query;
    const userId = req.get("userId");
    const success = db.favoriteThread(
      Number(threadId),
      Number(userId),
      Boolean(isFavorite)
    );

    if (success) {
      res.json(CommonUtils.responseMessage("Favorited"));
    } else {
      res.json(
        CommonUtils.responseMessage("Something went wrong, pls try again")
      );
    }
  });
}
