import { IsEmail, IsDefined } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for lost password
 */
class UserEmailDto {

  @IsEmail()
  @IsDefined()
  public email: string;

}

export default UserEmailDto;
