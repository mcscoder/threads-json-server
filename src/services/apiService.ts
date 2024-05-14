import { Application } from "express";
import { Repository } from "../repositories";
import CommonUtils from "../utils/common";
import { ThreadPostRequest } from "../types/models/thread";
import multer from "multer";
import { commonPath } from "../constants";
import { LoginRequest } from "../types/models/user/Request";

export function apiService(server: Application, db: Repository) {
  // ------------------- Set up multer to handle file uploads
  const storage = multer.diskStorage({
    destination: commonPath.publicImage,
    filename: function (req, file, cb) {
      req;
      cb(null, Date.now() + "-" + file?.originalname);
    },
  });

  const upload = multer({ storage: storage });

  // Handle POST request to /upload
  server.post("/api/upload/images", upload.array("files", 10), (req, res) => {
    const fileList = req.files as Express.Multer.File[];
    if (fileList) {
      const imageIds = db.uploadImages(fileList);

      // File has been uploaded successfully
      res.json(imageIds);
    }
  });

  // 1.1. Get a user by userId
  server.get("/api/user", (req, res) => {
    const userId = req.get("userId");
    res.json(db.getUserById(Number(userId)));
  });

  // 1.2. User Login authentication
  server.post("/api/authentication/login", (req, res) => {
    const loginRequest: LoginRequest = req.body;
    const response = db.userLoginAuthentication(loginRequest);
    if (response.user) {
      res.json(response);
    } else {
      res.status(401).json(response);
    }
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

  // 2.6. Get Thread replies
  server.get("/api/thread/replies/:mainThreadId", (req, res) => {
    const mainThreadId = Number(req.params.mainThreadId);
    const userId = Number(req.get("userId"));

    const threadReplies = db.getThreadDetails(mainThreadId, userId);
    if (threadReplies) {
      res.json(threadReplies);
    } else {
      res.json(CommonUtils.responseMessage("Something went wrong"));
    }
  });

  // 2.7. Favorite a Thread reply
  server.get("/api/thread/reply/favorite/:threadReplyId", (req, res) => {
    const { threadReplyId } = req.params;
    const { isFavorite } = req.query;
    const userId = req.get("userId");
    const success = db.favoriteThreadReply(
      Number(threadReplyId),
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

  // 2.8. Post a Thread reply
  server.post("/api/thread/reply", (req, res) => {
    const threadRequestBody: ThreadPostRequest = req.body;
    const success = db.postThreadReply(threadRequestBody);
    if (success) {
      res.json(CommonUtils.responseMessage("Thread reply has been posted"));
    }
  });

  // 2.9. Get all Threads by User Id
  server.get("/api/user/threads", (req, res) => {
    const userId = req.get("userId");
    res.json(db.getThreadsByUserId(Number(userId)));
  });

  // 2.10. Get all Thread Replies by User Id
  server.get("/api/user/replies", (req, res) => {
    const userId = req.get("userId");
    res.json(db.getAllUserReplies(Number(userId)));
  });
}
