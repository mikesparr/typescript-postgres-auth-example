import { IsString, IsDefined } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating roles
 */
class AddRoleDto {

  @IsString()
  @IsDefined()
  public id: string;

}

export default AddRoleDto;
