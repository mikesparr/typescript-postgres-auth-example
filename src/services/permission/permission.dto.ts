import { IsString, IsNumber } from 'class-validator';

/**
 * Data transfer object (DTO) with expected fields for creating permissions
 */
class CreatePermissionDto {

  @IsString()
  public resource: string;

  @IsString()
  public action: string;

  @IsString()
  public attributes: string;

}

export default CreatePermissionDto;
