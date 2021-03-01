import { Component, OnInit, Input } from '@angular/core';
import { NavController, ActionSheetController, AlertController, LoadingController, ModalController } from '@ionic/angular';
import { DatabaseService } from '../../services/database.service';
import { Storage } from '@ionic/storage';
import { CallNumber } from '@ionic-native/call-number/ngx';


@Component({
  selector: 'app-pedido-checklist',
  templateUrl: './pedido-checklist.page.html',
  styleUrls: ['./pedido-checklist.page.scss'],
})
export class PedidoChecklistPage implements OnInit {
  @Input () item: any = null;
  @Input () pedido_siguiente: any = null;
  constructor (
    private modalController: ModalController,
    private database: DatabaseService,
    private storage: Storage,
    public actionSheetController: ActionSheetController,
    public loadingCtrl: LoadingController,
    private callNumber: CallNumber,
    private alertController: AlertController
  ) { }

  ngOnInit() {
    console.log (this.item);
  }

  close () {
    this.modalController.dismiss (null, 'close');
  }

  async procesar () {
    const alert = await this.alertController.create({
      header: 'Confirmar operación',
      message: '¿Seguro que desea confirmar la entrega?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        }, {
          text: 'Confirmar',
          handler: async () => {
            const loading = await this.loadingCtrl.create ({
              message: 'Cargando información...'
            });
        
            loading.present ();
        
            this.database.confirmar_entrega_pedido (await this.storage.get ('usuario_id'), this.item, this.pedido_siguiente)
              .then (async () => {
                this.modalController.dismiss (null, 'ok');
                await loading.dismiss ();
              })
              .catch ((error: any) => {
        
              }); 
          }
        }
      ]
    });

    await alert.present();
  }

  async opciones () {
    const actionSheet = await this.actionSheetController.create({
      header: 'Albums',
      buttons: [{
        text: 'Pedido rechazado',
        icon: 'alert-circle',
        handler: () => {
          this.rechazado ();
        }
      }, {
        text: 'Llamar',
        icon: 'call',
        handler: () => {
          this.llamar ();
        }
      }, {
        text: 'Cerrar',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }]
    });

    await actionSheet.present ();
  }

  async rechazado () {

  }

  async llamar () {
    const loading = await this.loadingCtrl.create ({
      message: 'Cargando información...'
    });

    loading.present ();

    let preferencias: any = await this.database.get_preferencias ();

    await loading.dismiss ();

    this.callNumber.callNumber (preferencias.telefono, true)
      .then(res => console.log('Launched dialer!', res))
      .catch(err => console.log('Error launching dialer', err));
  }
}
