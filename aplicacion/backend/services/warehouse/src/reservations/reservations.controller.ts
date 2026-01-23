import { Controller, Get, UseGuards, Query, Req, Param } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { PickingService } from '../picking/picking.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService, private readonly pickingService: PickingService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'bodeguero')
  findAll(@Query('status') status?: string) {
    return this.reservationsService.findAll(status);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor', 'bodeguero')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }
}
