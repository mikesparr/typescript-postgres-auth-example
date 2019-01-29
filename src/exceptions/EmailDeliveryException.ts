import HttpException from "./HttpException";

class EmailDeliveryException extends HttpException {
  constructor(address: string) {
    super(400, `Error trying to send email to ${address}`);
  }
}

export default EmailDeliveryException;
