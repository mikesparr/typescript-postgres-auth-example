import { IsString, IsNumber, IsBoolean, IsDefined } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating toggles
 */
class CreateToggleDto {

  @IsString()
  @IsDefined()
  public key: string;

  @IsString()
  public name: string;

  @IsString()
  public type: string;

}

export default CreateToggleDto;
