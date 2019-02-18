import HttpException from "./HttpException";

class MissingParametersException extends HttpException {
  constructor(message: string) {
    super(400, message);
  }
}

export default MissingParametersException;
