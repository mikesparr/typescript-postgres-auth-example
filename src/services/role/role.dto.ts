import { IsString, IsNumber } from 'class-validator';

/**
 * Data transfer object (DTO) with expected fields for creating roles
 */
class CreateRoleDto {
  @IsString()
  public id: string;

  @IsString()
  public description: string;
}

export default CreateRoleDto;
