import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PedidoChecklistPageRoutingModule } from './pedido-checklist-routing.module';

import { PedidoChecklistPage } from './pedido-checklist.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PedidoChecklistPageRoutingModule
  ],
  declarations: [PedidoChecklistPage]
})
export class PedidoChecklistPageModule {}
