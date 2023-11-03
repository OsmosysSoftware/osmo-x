import { IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ComponentDto {
  @IsString()
  type: string;

  @ValidateNested({ each: true })
  @Type(() => ParameterDto)
  parameters: ParameterDto[];
}

class ParameterDto {
  @IsString()
  type: string;

  @IsString()
  text: string;
}

class TextDto {
  @IsString()
  body: string;
}

class LanguageDto {
  @IsString()
  policy: string;

  @IsString()
  code: string;
}

class TemplateDto {
  @IsString()
  namespace: string;

  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => LanguageDto)
  language: LanguageDto;

  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  components: ComponentDto[];
}

export class Wa360DialogDataDto {
  @IsString()
  to: string;

  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => TemplateDto)
  @IsOptional()
  template?: TemplateDto;

  @ValidateNested()
  @Type(() => TextDto)
  @IsOptional()
  text?: TextDto;
}
