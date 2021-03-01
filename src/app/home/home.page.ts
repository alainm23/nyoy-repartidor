import { Component, OnInit } from '@angular/core';

// Services
import { NavController, AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { Storage } from '@ionic/storage';
declare var google: any;
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  items: any [] = [];
  preferencias: any;

  // Google
  directionsService: any = new google.maps.DirectionsService ();
  constructor (
    public auth: AuthService,
    public database: DatabaseService,
    public navController: NavController,
    public alertController: AlertController,
    public storage: Storage,
    public loadingCtrl: LoadingController
  ) {}

  async ngOnInit () {
    const loading = await this.loadingCtrl.create ({
      message: 'Cargando información...'
    });

    loading.present ();

    let usuario: any = await this.database.get_usuario_to_promise (await this.storage.get ('usuario_id'));
    if (usuario.estado === 1) {
      this.navController.navigateForward ('delivery-check');
    } else {
      this.preferencias = await this.database.get_preferencias ();
      this.database.get_pedidos_by_repartidor (await this.storage.get ('usuario_id'), 2).subscribe ((res: any []) => {
        this.items = res;
        console.log (res);
        loading.dismiss ();
      });
    }
  }
  
  async iniciar_ruta () {
    const alert = await this.alertController.create({
      header: 'Confirmar operación',
      message: '¿Esta seguro que desea iniciar la ruta del delivery?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          }
        }, {
          text: 'Iniciar',
          handler: () => {
            this.crear_ruta ();
          }
        }
      ]
    });

    await alert.present();
  }

  async crear_ruta () {
    const loading = await this.loadingCtrl.create ({
      message: 'Cargando información...'
    });

    loading.present ();

    let point_inicio = new google.maps.LatLng (this.preferencias.local_latitud, this.preferencias.local_longitud);

    let waypoints: any [] = [];
    this.items.forEach ((i: any) => {
      waypoints.push ({
        location: new google.maps.LatLng (i.pedido.latitud, i.pedido.longitud),
        stopover: true
      });
    });

    let request = {
      origin: point_inicio,
      destination: point_inicio,
      waypoints: waypoints,
      optimizeWaypoints: true,
      provideRouteAlternatives: true,
      travelMode: google.maps.TravelMode ['DRIVING']
    }

    this.directionsService.route (request, async (response: any, status: any) => {
      if (status === 'OK') {
        let orden = 0;
        response.routes [0].waypoint_order.forEach ((index: number) => {
          this.items [index].orden = orden;
          orden++; 
        });
        
        this.database.crear_ruta_pedidos (await this.storage.get ('usuario_id'), this.items)
          .then (() => {
            loading.dismiss ();
            this.navController.navigateRoot ('delivery-check');

            let tokens: string = '';
            this.items.forEach ((item: any) => {
              tokens += item.pedido.usuario_token + ','
            });
            const push_data: any = {
              titulo: 'Pedido actualizado',
              detalle: 'Su pedido ya esta en camino',
              mode: 'tokens',
              tokens: tokens,
              clave: ''
            };
            this.database.send_notification (push_data).subscribe (response => {
            }, error => {
            });

          }).catch ((error: any) => {
            console.log (error);
            loading.dismiss ();
          });
      } else {
        
      }
    });
  }
} 
