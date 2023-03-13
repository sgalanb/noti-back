import * as functions from "firebase-functions";
import { app } from "./config/express";

exports.api = functions
  .runWith({
    timeoutSeconds: 300,
    memory: "2GB",
  })
  .https.onRequest(app);
