import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { SortOrder } from 'src/common/constants/notifications';
import { UniversalFilter } from './universal-filter.dto';

@InputType()
export class QueryOptionsDto {
  @Field(() => Int, { defaultValue: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @Field(() => Int, { defaultValue: 10, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Field(() => SortOrder, { nullable: true, defaultValue: SortOrder.ASC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @Field(() => [UniversalFilter], { nullable: true })
  @IsOptional()
  filters?: UniversalFilter[];
}
