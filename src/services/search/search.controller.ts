import { NextFunction, Request, Response, Router } from "express";
import { getPlaces } from "./provider/OpenCageDataProvider";
import Controller from '../../interfaces/controller.interface';

/**
 * Example external API interaction searching geo service
 */
class SearchController implements Controller {
  public path: string = "/search";
  public router: Router = Router();
  
  constructor() {
    this.router.get(this.path, this.getPlacesByName);
  }

  private getPlacesByName = async (request: Request, response: Response, next: NextFunction) => {
    const { q } = request.query;

    let places: {[key: string]: any};
    if (q.length < 3) {
      places = {
        features: [],
        type: "FeatureCollection",
      };
    }
  
    places = await getPlaces(q);
    response.send(places);
  }
}

export default SearchController;
