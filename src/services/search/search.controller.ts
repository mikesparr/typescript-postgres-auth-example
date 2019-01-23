import { NextFunction, Request, Response, Router } from "express";
import { getPlaces } from "./provider/OpenCageDataProvider";
import Controller from '../../interfaces/controller.interface';

class SearchController implements Controller {
  public path: string = "/search";
  public router: Router = Router();
  
  constructor() {
    this.router.get(this.path, this.getPlacesByName);
  }

  private getPlacesByName = async (req: Request, res: Response, next: NextFunction) => {
    const { q } = req.query;

    let places: {[key: string]: any};
    if (q.length < 3) {
      places = {
        features: [],
        type: "FeatureCollection",
      };
    }
  
    places = await getPlaces(q);
    res.send(places);
  }
}

export default SearchController;
