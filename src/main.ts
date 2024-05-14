import jsonServer from "json-server";
import { DatabaseEntity } from "./types/entities/Database";
import express from "express";
import { Repository } from "./repositories";
import { apiService } from "./services";
import { commonPath } from "./constants";

const server = jsonServer.create();
const router = jsonServer.router<DatabaseEntity>("db.json");
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(jsonServer.bodyParser);
server.use("/api/public/images", express.static(commonPath.publicImage));

// server.use((req, res, next) => {
//   res;
//   if (req.method === "GET") {
//     console.log(req.headers);
//     console.log(req.body);
//   }
//   // Continue to JSON Server router
//   next();
// });

apiService(server, new Repository(router.db));

// Use default router -------------------------
server.use("/api", router);
server.listen(3000, () => {
  console.log("JSON Server is running");
});
