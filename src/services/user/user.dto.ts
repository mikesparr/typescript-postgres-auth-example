import { IsEmail, IsString, IsNumber } from 'class-validator';

/**
 * Data transfer object (DTO) with expected fields for creating users
 */
class CreateUserDto {
  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;

  @IsNumber()
  public age: number;

  @IsEmail()
  public email: string;

  @IsString()
  public password: string;

}

export default CreateUserDto;
