import {
  IsBoolean,
  IsString,
  IsNumber,
  IsJSON,
  IsArray,
  IsDefined,
  IsOptional,
  NotContains,
} from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating roles
 */
class CreateSegmentDto {

  @IsString()
  @IsDefined()
  @NotContains(" ", { message: "No spaces allowed (i.e. my-segment-key)"} )
  public key: string;

  @IsString()
  @IsOptional()
  public name: string;

  @IsArray()
  @IsOptional()
  public included: number[] | string[];

  @IsArray()
  @IsOptional()
  public excluded: number[] | string[];

  @IsJSON()
  @IsOptional()
  public rules: any;

  @IsBoolean()
  @IsOptional()
  public deleted: boolean;

}

export default CreateSegmentDto;
