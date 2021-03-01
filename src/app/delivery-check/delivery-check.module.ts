import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DeliveryCheckPageRoutingModule } from './delivery-check-routing.module';

import { DeliveryCheckPage } from './delivery-check.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DeliveryCheckPageRoutingModule
  ],
  declarations: [DeliveryCheckPage]
})
export class DeliveryCheckPageModule {}
