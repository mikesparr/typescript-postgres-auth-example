import HttpException from "./HttpException";

class DuplicateRecordException extends HttpException {
  constructor() {
    super(400, `Duplicate record already exists`);
  }
}

export default DuplicateRecordException;
