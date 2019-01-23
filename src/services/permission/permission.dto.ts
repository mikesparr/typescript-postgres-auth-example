import { IsString, IsNumber } from 'class-validator';

class CreatePermissionDto {

  @IsString()
  public resource: string;

  @IsString()
  public action: string;

  @IsString()
  public attributes: string;

}

export default CreatePermissionDto;
