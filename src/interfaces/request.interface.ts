import { Request } from "express";
import { User } from "../services/user/user.entity";

interface RequestWithUser extends Request {
  user: User;
}

export default RequestWithUser;
