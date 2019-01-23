import { IsString, IsNumber } from 'class-validator';

class CreateRoleDto {
  @IsString()
  public id: string;

  @IsString()
  public description: string;
}

export default CreateRoleDto;
