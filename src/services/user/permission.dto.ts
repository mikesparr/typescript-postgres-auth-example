import { IsString, IsNumber, IsDefined, IsOptional } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating permissions
 */
class CreatePermissionDto {

  @IsString()
  @IsOptional()
  public role: string;

  @IsString()
  public resource: string;

  @IsString()
  public action: string;

  @IsString()
  @IsDefined()
  public attributes: string;

}

export default CreatePermissionDto;
