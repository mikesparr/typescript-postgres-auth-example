import { IsString, IsNumber, IsDefined } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating roles
 */
class CreateRoleDto {

  @IsString()
  @IsDefined()
  public id: string;

  @IsString()
  public description: string;

}

export default CreateRoleDto;
