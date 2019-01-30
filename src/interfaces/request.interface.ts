import { Request } from "express";
import { User } from "../services/user/user.entity";

interface RequestWithUser extends Request {
  user: User;
  userAgent?: {[key: string]: any};
}

export default RequestWithUser;
