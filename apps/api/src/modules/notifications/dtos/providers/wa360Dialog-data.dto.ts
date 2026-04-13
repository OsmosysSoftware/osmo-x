import { IsString, IsOptional, ValidateNested, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class ImageDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  link?: string;
}

class DocumentDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsString()
  @IsOptional()
  filename?: string;
}

class VideoDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  link?: string;
}

class LocationDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

class DateTimeDto {
  @IsString()
  @IsOptional()
  fallback_value?: string;

  @IsNumber()
  @IsOptional()
  day_of_week?: number;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsNumber()
  @IsOptional()
  month?: number;

  @IsNumber()
  @IsOptional()
  day_of_month?: number;

  @IsNumber()
  @IsOptional()
  hour?: number;

  @IsNumber()
  @IsOptional()
  minute?: number;

  @IsString()
  @IsOptional()
  calendar?: string;
}

class CurrencyDto {
  @IsString()
  fallback_value: string;

  @IsString()
  code: string;

  @IsNumber()
  amount_1000: number;
}

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

  @ValidateNested()
  @Type(() => ImageDto)
  @IsOptional()
  image?: ImageDto;

  @ValidateNested()
  @Type(() => DocumentDto)
  @IsOptional()
  document?: DocumentDto;

  @ValidateNested()
  @Type(() => VideoDto)
  @IsOptional()
  video?: VideoDto;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ValidateNested()
  @Type(() => DateTimeDto)
  @IsOptional()
  date_time?: DateTimeDto;

  @ValidateNested()
  @Type(() => CurrencyDto)
  @IsOptional()
  currency?: CurrencyDto;

  @IsString()
  @IsOptional()
  text?: string;
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
  @ApiPropertyOptional({ example: 'whatsapp' })
  @IsString()
  @IsOptional()
  messaging_product?: string;

  @IsNotEmpty()
  to: string;

  @IsNotEmpty()
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
