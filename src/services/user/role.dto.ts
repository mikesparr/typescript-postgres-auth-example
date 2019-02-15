import {
  IsBoolean,
  IsString,
  IsNumber,
  IsDefined,
  IsOptional,
} from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating roles
 */
class CreateRoleDto {

  @IsString()
  @IsDefined()
  public id: string;

  @IsString()
  public description: string;

  @IsBoolean()
  @IsOptional()
  public archived: boolean;

}

export default CreateRoleDto;
