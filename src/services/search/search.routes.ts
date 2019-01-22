import { Request, Response } from "express";
import { getPlacesByName } from "./search.controller";

export default [{
  handler: [
    async ({ query }: Request, res: Response) => {
      const result = await getPlacesByName(query.q);
      res.status(200).send(result);
    },
  ],
  method: "get",
  path: "/api/v1/search",
}];
