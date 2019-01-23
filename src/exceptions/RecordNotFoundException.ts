import HttpException from "./HttpException";

class RecordNotFoundException extends HttpException {
  constructor(id: string) {
    super(404, `Record with id ${id} not found`);
  }
}

export default RecordNotFoundException;
