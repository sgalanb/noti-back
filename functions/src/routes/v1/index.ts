import { Router } from "express";
import { checkPrices } from "./checkPrices";
const v1 = Router();

v1.use("/check-prices", checkPrices);

export { v1 };
