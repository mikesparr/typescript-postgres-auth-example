import { IsString, IsNumber } from 'class-validator';

class CreateUserDto {
  @IsString()
  public firstName: string;

  @IsString()
  public lastName: string;

  @IsNumber()
  public age: number;
}

export default CreateUserDto;
