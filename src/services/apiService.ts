import { Application } from "express";
import { Repository } from "../repositories";
import { ThreadPostRequest } from "../types/models/thread";
import CommonUtils from "../utils/common";

export function apiService(server: Application, db: Repository) {
  // 1.1. Get all users
  server.get("/api/users", (req, res) => {
    req;
    res.json(db.getAllUsers());
  });

  // 2.1. Get all threads
  server.get("/api/threads", (req, res) => {
    req;
    res.json(db.getAllThreads());
  });

  // 2.2. Post a thread
  server.post("/api/threads", (req, res) => {
    const thread: ThreadPostRequest = req.body;
    db.addThread(thread);
    res.json(CommonUtils.responseMessage("Your thread has been posted!"));
  });

  // 2.3. Get a list of random threads
  server.get("/api/threads/random/:count", (req, res) => {
    const userId: string | undefined = req.get("userId");
    const count: string = req.params.count;
    if (userId) {
      res.json(db.getRandomThreads(Number(userId), Number(count)));
    }
  });
}
