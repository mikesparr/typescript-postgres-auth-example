import { Request, Response } from "express";
import { checkSearchParams } from "../../middleware/checks";
import { getPlacesByName } from "./search.controller";

export default [{
  handler: [
    checkSearchParams,
    async ({ query }: Request, res: Response) => {
      const result = await getPlacesByName(query.q);
      res.status(200).send(result);
    },
  ],
  method: "get",
  path: "/api/v1/search",
}];
