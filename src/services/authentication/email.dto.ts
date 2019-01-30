import { IsEmail } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for lost password
 */
class UserEmailDto {
  @IsEmail()
  public email: string;
}

export default UserEmailDto;
