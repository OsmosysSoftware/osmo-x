import {
  IsString,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
  IsNumber,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ImageDto {
  @ApiPropertyOptional({ description: 'Media object ID', example: '1234567890' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    description: 'Publicly accessible URL of the image',
    example: 'https://example.com/image.png',
  })
  @IsString()
  @IsOptional()
  link?: string;
}

class DocumentDto {
  @ApiPropertyOptional({ description: 'Media object ID', example: '1234567890' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    description: 'Publicly accessible URL of the document',
    example: 'https://example.com/doc.pdf',
  })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiPropertyOptional({ description: 'Filename of the document', example: 'report.pdf' })
  @IsString()
  @IsOptional()
  filename?: string;
}

class VideoDto {
  @ApiPropertyOptional({ description: 'Media object ID', example: '1234567890' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({
    description: 'Publicly accessible URL of the video',
    example: 'https://example.com/video.mp4',
  })
  @IsString()
  @IsOptional()
  link?: string;
}

class LocationDto {
  @ApiProperty({ description: 'Latitude of the location', example: 37.7749 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude of the location', example: -122.4194 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Name of the location', example: 'Headquarters' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Address of the location',
    example: '1 Hacker Way, Menlo Park, CA',
  })
  @IsString()
  @IsOptional()
  address?: string;
}

class DateTimeDto {
  @ApiPropertyOptional({
    description: 'Fallback value for unsupported clients',
    example: 'Monday, January 1, 2024',
  })
  @IsString()
  @IsOptional()
  fallback_value?: string;

  @ApiPropertyOptional({ description: 'Day of the week (1=Monday … 7=Sunday)', example: 1 })
  @IsNumber()
  @IsOptional()
  day_of_week?: number;

  @ApiPropertyOptional({ description: 'Year', example: 2024 })
  @IsNumber()
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ description: 'Month (1–12)', example: 1 })
  @IsNumber()
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({ description: 'Day of the month (1–31)', example: 15 })
  @IsNumber()
  @IsOptional()
  day_of_month?: number;

  @ApiPropertyOptional({ description: 'Hour (0–23)', example: 9 })
  @IsNumber()
  @IsOptional()
  hour?: number;

  @ApiPropertyOptional({ description: 'Minute (0–59)', example: 30 })
  @IsNumber()
  @IsOptional()
  minute?: number;

  @ApiPropertyOptional({ description: 'Calendar type', example: 'GREGORIAN' })
  @IsString()
  @IsOptional()
  calendar?: string;
}

class CurrencyDto {
  @ApiProperty({ description: 'Fallback value shown to unsupported clients', example: 'USD 10.50' })
  @IsString()
  fallback_value: string;

  @ApiProperty({ description: 'ISO 4217 currency code', example: 'USD' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Amount multiplied by 1000 (e.g., $10.50 → 10500)', example: 10500 })
  @IsNumber()
  amount_1000: number;
}

class ComponentDto {
  @ApiProperty({
    description: 'Component type (e.g., header, body, footer, button)',
    example: 'body',
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Array of parameter objects for the component',
    type: () => [ParameterDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ParameterDto)
  parameters: ParameterDto[];
}

class ParameterDto {
  @ApiProperty({
    description: 'Parameter type: text, image, document, video, location, date_time, or currency',
    example: 'text',
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({
    description: 'Image media object (used when type is image)',
    type: () => ImageDto,
  })
  @ValidateNested()
  @Type(() => ImageDto)
  @IsOptional()
  image?: ImageDto;

  @ApiPropertyOptional({
    description: 'Document media object (used when type is document)',
    type: () => DocumentDto,
  })
  @ValidateNested()
  @Type(() => DocumentDto)
  @IsOptional()
  document?: DocumentDto;

  @ApiPropertyOptional({
    description: 'Video media object (used when type is video)',
    type: () => VideoDto,
  })
  @ValidateNested()
  @Type(() => VideoDto)
  @IsOptional()
  video?: VideoDto;

  @ApiPropertyOptional({
    description: 'Location object (used when type is location)',
    type: () => LocationDto,
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ApiPropertyOptional({
    description: 'Date/time object (used when type is date_time)',
    type: () => DateTimeDto,
  })
  @ValidateNested()
  @Type(() => DateTimeDto)
  @IsOptional()
  date_time?: DateTimeDto;

  @ApiPropertyOptional({
    description: 'Currency object (used when type is currency)',
    type: () => CurrencyDto,
  })
  @ValidateNested()
  @Type(() => CurrencyDto)
  @IsOptional()
  currency?: CurrencyDto;

  @ApiPropertyOptional({
    description: 'Text value (required when type is text)',
    example: 'John Doe',
  })
  @ValidateIf((o: ParameterDto) => o.type === 'text')
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  text?: string;
}

class TextDto {
  @ApiProperty({ description: 'Body text of the message', example: 'Hello, World!' })
  @IsString()
  body: string;
}

class LanguageDto {
  @ApiProperty({ description: 'Language policy', example: 'deterministic' })
  @IsString()
  policy: string;

  @ApiProperty({ description: 'BCP-47 language code', example: 'en' })
  @IsString()
  code: string;
}

class TemplateDto {
  @ApiProperty({
    description: 'Template namespace from 360Dialog',
    example: 'd8bcb6bd_2ab2_439c_9d9e_947501266c77',
  })
  @IsString()
  namespace: string;

  @ApiProperty({ description: 'Template name', example: 'ir_incident_resolution' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Language configuration for the template', type: () => LanguageDto })
  @ValidateNested()
  @Type(() => LanguageDto)
  language: LanguageDto;

  @ApiProperty({
    description: 'Array of component objects with parameters',
    type: () => [ComponentDto],
  })
  @ValidateNested({ each: true })
  @Type(() => ComponentDto)
  components: ComponentDto[];
}

export class Wa360DialogDataDto {
  @ApiPropertyOptional({
    description: "The messaging product. Always set to 'whatsapp'.",
    example: 'whatsapp',
    enum: ['whatsapp'],
  })
  @IsIn(['whatsapp'])
  @IsOptional()
  messaging_product?: string;

  @ApiProperty({
    description: "Recipient's phone number (without + prefix)",
    example: '919004812051',
  })
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: "Message type (e.g., 'template' or 'text')", example: 'template' })
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({
    description: 'Template configuration object (required when type is template)',
    type: () => TemplateDto,
  })
  @ValidateIf((o: Wa360DialogDataDto) => o.type === 'template')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TemplateDto)
  template?: TemplateDto;

  @ApiPropertyOptional({
    description: 'Text message object (required when type is text)',
    type: () => TextDto,
  })
  @ValidateIf((o: Wa360DialogDataDto) => o.type === 'text')
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TextDto)
  text?: TextDto;
}
