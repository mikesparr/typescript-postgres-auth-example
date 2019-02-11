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
class CreateRelationDto {

  @IsString()
  @IsDefined()
  @NotContains(" ", { message: "No spaces allowed (i.e. IS_MEMBER, MEMBER_OF)"} )
  public relation: string;

  @IsString()
  @IsDefined()
  @NotContains(" ", { message: "No spaces allowed (i.e. UUID)"} )
  public sourceId: string;

  @IsString()
  @IsDefined()
  public sourceType: string;

  @IsString()
  @IsDefined()
  @NotContains(" ", { message: "No spaces allowed (i.e. UUID)"} )
  public targetId: string;

  @IsString()
  @IsDefined()
  public targetType: string;

  @IsString()
  @IsOptional()
  public label: string;

  @IsJSON()
  @IsOptional()
  public meta: any;

  @IsBoolean()
  @IsOptional()
  public enabled: boolean;

}

export default CreateRelationDto;
