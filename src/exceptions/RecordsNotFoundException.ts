import HttpException from "./HttpException";

class RecordsNotFoundException extends HttpException {
  constructor(resource: string) {
    super(404, `No ${resource} records were found`);
  }
}

export default RecordsNotFoundException;
