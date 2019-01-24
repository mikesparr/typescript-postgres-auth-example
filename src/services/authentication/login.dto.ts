import { IsString, IsEmail } from 'class-validator';

/**
 * Data transfer object (DTO) with expected fields for user login
 */
class UserLoginDto {
  @IsEmail()
  public email: string;

  @IsString()
  public password: string;
}

export default UserLoginDto;
