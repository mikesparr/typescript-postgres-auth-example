import { IsString, IsNumber, IsDefined } from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating toggles
 */
class CreateToggleDto {

  @IsString()
  @IsDefined()
  public id: string;

  @IsString()
  public name: string;

}

export default CreateToggleDto;
