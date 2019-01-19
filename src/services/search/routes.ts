import { Request, Response } from "express";

export default [
  {
    handler: async (req: Request, res: Response) => {
      res.send("Hello world!");
    },
    method: "get",
    path: "/",
  },
];
