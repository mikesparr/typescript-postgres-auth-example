import {
  IsEnum,
  IsString,
  IsBoolean,
  IsJSON,
  NotContains,
  IsDefined,
  IsOptional,
} from "class-validator";
import { FlagType } from "./flag.entity";

/**
 * Data transfer object (DTO) with expected fields for creating flags
 */
class CreateFlagDto {

  @IsString()
  @IsDefined()
  @NotContains(" ", { message: "No spaces allowed (i.e. my.flag.key)"} )
  public key: string;

  @IsString()
  public name: string;

  @IsEnum(FlagType)
  @IsOptional()
  public type: string;

  @IsString()
  @IsOptional()
  public description: string;

  @IsString()
  @IsOptional()
  public product: string;

  @IsString()
  @IsOptional()
  public story: string;

  @IsString()
  @IsOptional()
  public squad: string;

  @IsBoolean()
  @IsOptional()
  public trackable: boolean;

  @IsBoolean()
  @IsOptional()
  public enabled: boolean;

  @IsBoolean()
  @IsOptional()
  public temporary: boolean;

  @IsBoolean()
  @IsOptional()
  public archived: boolean;

  @IsJSON()
  @IsOptional()
  public variants: any;

}

export default CreateFlagDto;
