import {
  IsString,
  IsBoolean,
  IsNumber,
  IsDefined,
  IsOptional,
  IsDate,
  NotContains,
} from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating goals
 */
class CreateGoalDto {

  @IsString()
  @IsDefined()
  @NotContains(" ", { message: "No spaces allowed (i.e. my-goal-key)" } )
  public key: string;

  @IsString()
  public name: string;

  @IsNumber()
  @IsOptional()
  public hits: number;

  @IsNumber()
  @IsOptional()
  public uniqueUsers: number;

  @IsNumber()
  @IsOptional()
  public targetHits: number;

  @IsNumber()
  @IsOptional()
  public targetUniqueUsers: number;

  @IsDate()
  @IsOptional()
  public start: Date;

  @IsDate()
  @IsOptional()
  public stop: Date;

  @IsBoolean()
  @IsOptional()
  public enabled: boolean;

}

export default CreateGoalDto;
