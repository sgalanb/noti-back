import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { api } from "../routes";

const API_PREFIX = "api";
const app: Express = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT"],
  })
);
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.url.indexOf(`/${API_PREFIX}/`) === 0) {
    req.url = req.url.substring(API_PREFIX.length + 1);
  }
  next();
});

app.use("/", api);

export { app };
