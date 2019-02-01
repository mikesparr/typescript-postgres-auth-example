import { IsString, IsBoolean, IsNumber, IsDefined } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating goals
 */
class CreateGoalDto {

  @IsString()
  @IsDefined()
  public key: string;

  @IsString()
  public name: string;

}

export default CreateGoalDto;
