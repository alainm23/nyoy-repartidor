import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PedidoChecklistPage } from './pedido-checklist.page';

const routes: Routes = [
  {
    path: '',
    component: PedidoChecklistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PedidoChecklistPageRoutingModule {}
