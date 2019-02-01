import { IsBoolean, IsString, IsNumber, IsDefined } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating roles
 */
class CreateRuleDto {

  @IsString()
  @IsDefined()
  public key: string;

  @IsString()
  public name: string;

}

export default CreateRuleDto;
