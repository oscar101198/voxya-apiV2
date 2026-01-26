import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class StatisticResponseDto {
  @ApiProperty({
    description: "Nombre total d'utilisateurs",
    example: 150,
  })
  @Expose()
  totalUsers: number;
}
