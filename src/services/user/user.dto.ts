import {
  IsEmail,
  IsIP,
  IsString,
  IsNumber,
  IsDefined,
  IsOptional,
  NotContains,
  MinLength,
  MaxLength,
  Length,
  IsUrl,
} from "class-validator";

/**
 * Data transfer object (DTO) with expected fields for creating users
 */
class CreateUserDto {

  @IsString()
  @IsOptional()
  public firstName: string;

  @IsString()
  @IsOptional()
  public lastName: string;

  @IsEmail()
  @IsDefined()
  public email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(48)
  @NotContains(" ", { message: "No spaces allowed" } )
  @IsOptional()
  public password: string;

  @IsUrl()
  @IsOptional()
  public avatar: string;

  @IsString({ message: "Use a valid 2-digit country code (i.e. US)" })
  @MinLength(2)
  @MaxLength(2)
  @IsOptional()
  public country: string;

  @IsString()
  @IsOptional()
  public timeZone: string;

  @IsString({ message: "Use a valid 5-digit language code (i.e. en_US)" })
  @MinLength(5)
  @MaxLength(5)
  @IsOptional()
  public language: string;

  @IsIP()
  @IsOptional()
  public ip: string;

  @IsNumber()
  @IsOptional()
  public age: number;

}

export default CreateUserDto;
