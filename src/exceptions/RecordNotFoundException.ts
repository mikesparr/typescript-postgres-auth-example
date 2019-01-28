import HttpException from "./HttpException";

class RecordNotFoundException extends HttpException {
  constructor(id: string | number) {
    super(404, `Record with id ${id} not found`);
  }
}

export default RecordNotFoundException;
