import { IsString, IsEmail } from 'class-validator';

class UserLoginDto {
  @IsEmail()
  public email: string;

  @IsString()
  public password: string;
}

export default UserLoginDto;
