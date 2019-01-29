import { IsString, IsDefined, IsEmail } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for sending email
 */
class SendEmailDto {

  @IsEmail()
  @IsDefined()
  public from: string;

  @IsEmail()
  @IsDefined()
  public to: string;

  @IsEmail()
  public cc?: string;

  @IsString()
  @IsDefined()
  public subject: string;

  @IsString()
  @IsDefined()
  public text: string;

  @IsString()
  public html?: string;

}

export default SendEmailDto;
