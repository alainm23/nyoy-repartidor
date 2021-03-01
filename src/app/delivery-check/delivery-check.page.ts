import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

// Services
import { NavController, AlertController, LoadingController, ModalController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database.service';
import { Storage } from '@ionic/storage';
declare var google: any;
import { first } from 'rxjs/operators';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { PedidoChecklistPage } from '../modals/pedido-checklist/pedido-checklist.page';

@Component({
  selector: 'app-delivery-check',
  templateUrl: './delivery-check.page.html',
  styleUrls: ['./delivery-check.page.scss'],
})
export class DeliveryCheckPage implements OnInit {
  @ViewChild ('map', { static: false }) mapRef: ElementRef;
  map: any;
  preferencias: any;
  directionsService: any;
  directionsDisplay: any;
  marker_inicio: any;
  marker_destino: any;
  action: any = {
    nombre: '',
    usuario_nombre: '',
    pedido: null,
    pedido_siguiente: null
  };
  usuario_id: string = '';
  watchPosition: any = null;
  constructor (
    public auth: AuthService,
    public database: DatabaseService,
    public navController: NavController,
    public alertController: AlertController,
    public storage: Storage,
    public loadingController: LoadingController,
    private modalController: ModalController,
    private geolocation: Geolocation,
    private loadingCtrl: LoadingController
  ) {}

  async ngOnInit () {
    const loading = await this.loadingCtrl.create ({
      message: 'Cargando información...'
    });

    loading.present ();

    this.usuario_id = await this.storage.get ('usuario_id');
    this.preferencias = await this.database.get_preferencias ();
    this.check_pedidos (loading);
  }
  
  async check_pedidos (loading: any) {
    let items: any = await this.database.get_pedidos_by_repartidor (await this.storage.get ('usuario_id'), 3).pipe (first ()).toPromise ();
    items = items.sort ((a: any, b: any) => {
      if (a.data.orden < b.data.orden) {
        return -1;
      }

      if (a.data.orden > b.data.orden) {
        return 1
      }

      return 0;
    });

    let pedido_actual = items [0];
    if (pedido_actual === undefined) {
      pedido_actual = null;
    }
    let pedido_siguiente = items [1];
    if (pedido_siguiente === undefined) {
      pedido_siguiente = null;
    }

    if (pedido_actual !== null) {
      this.start_tracking ();
      this.action.nombre = 'Confirmar llegada';
      this.action.usuario_nombre = pedido_actual.pedido.usuario_nombre;
      this.action.pedido = pedido_actual;
      this.action.pedido_siguiente = pedido_siguiente;

      if (pedido_actual.pedido.repartidor_llego) {
        this.open_checklist_pedido (this.action.pedido, this.action.pedido_siguiente);
      }
    } else {
      this.action.nombre = 'Ruta finalizada';
      this.action.usuario_nombre = '';
      this.action.pedido = null;
      this.stop_tracking ();
    }

    this.InitMap (pedido_actual);
    loading.dismiss ();
  }
  
  stop_tracking () {
    if (this.watchPosition !== null) {
      this.watchPosition.unsubscribe ();
    }
  }

  start_tracking () {
    if (this.watchPosition === null) {
      this.watchPosition = this.geolocation.watchPosition ().subscribe ((data) => {
        this.database.update_usuario (this.usuario_id, {
          latitud: data.coords.latitude,
          longitud: data.coords.longitude
        });
      });
    }
  }

  async InitMap (item: any) {
    const options = {  
      center: new google.maps.LatLng (this.preferencias.local_latitud, this.preferencias.local_longitud),
      zoom: 15,
      disableDefaultUI: true,
      streetViewControl: false,
      disableDoubleClickZoom: false,
      clickableIcons: false,
      scaleControl: true,
      styles: [
        {
          "featureType": "poi",
          "elementType": "labels.text",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "poi.business",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "road",
          "elementType": "labels.icon",
          "stylers": [{
            "visibility": "off"
          }]
        },
        {
          "featureType": "transit",
          "stylers": [{
            "visibility": "off"
          }]
        }
      ],
      mapTypeId: 'roadmap',
    }

    this.map = await new google.maps.Map (this.mapRef.nativeElement, options);
    this.directionsDisplay = new google.maps.DirectionsRenderer ();
    this.directionsService = new google.maps.DirectionsService ();

    let point_inicio: any;
    let point_destino: any;
    if (item !== null) {
      if (item.data.orden <= 0) {
        point_inicio = new google.maps.LatLng (this.preferencias.local_latitud, this.preferencias.local_longitud);
        point_destino = new google.maps.LatLng (item.pedido.latitud, item.pedido.longitud);
  
        this.marker_inicio = new google.maps.Marker ({
          position: point_inicio,
          icon: 'assets/nyoy.png',
          map: this.map
        });
  
        this.marker_destino = new google.maps.Marker ({
          position: point_destino,
          label: { 
            text: (item.data.orden + 1).toString (),
            color: "white",
            fontWeight: 'bold',
            fontSize: '16px'
          },
          map: this.map
        });
      } else {
        point_inicio = new google.maps.LatLng (item.data.pedido_anterior_latitud, item.data.pedido_anterior_longitud);
        point_destino = new google.maps.LatLng (item.pedido.latitud, item.pedido.longitud);

        this.marker_inicio = new google.maps.Marker ({
          position: point_inicio,
          label: { 
            text: (item.data.orden).toString (),
            color: "white",
            fontWeight: 'bold',
            fontSize: '16px'
          },
          map: this.map
        });

        this.marker_destino = new google.maps.Marker ({
          position: point_destino,
          label: { 
            text: (item.data.orden + 1).toString (),
            color: "white",
            fontWeight: 'bold',
            fontSize: '16px'
          },
          map: this.map
        });
      }

      this.directionsDisplay.setMap (this.map);
      this.directionsDisplay.setOptions({
        suppressMarkers: true
      });

      let request = {
        origin: point_inicio,
        destination: point_destino,
        travelMode: google.maps.TravelMode ['DRIVING']
      }

      this.directionsService.route (request, (response: any, status: any) => {
        if (status == 'OK') {
          this.directionsDisplay.setDirections (response);
        }
      });
    } 
  }

  async procesar () {
    if (this.action.pedido !== null) {
      this.presentAlertConfirm ();
    } else {
      const loading = await this.loadingCtrl.create ({
        message: 'Cargando información...'
      });
  
      loading.present ();

      this.database.update_usuario (await this.storage.get ('usuario_id'), { estado: 0 })
        .then (async () => {
          await loading.dismiss ();
          this.navController.navigateRoot ('home');
        })
        .catch ((error: any) => {
          console.log (error);
        });
    }
  }

  async presentAlertConfirm () {
    const alert = await this.alertController.create({
      header: 'Confirmar operación',
      message: '¿Seguro llego a su destino?',
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

            this.database.confirmar_repartidor_llego (this.action.pedido)
              .then (async () => {
                await loading.dismiss ();
                this.open_checklist_pedido (this.action.pedido, this.action.pedido_siguiente);
                
                const push_data: any = {
                  titulo: 'Pedido actualizado',
                  detalle: 'El repartidor ya se encuentra',
                  mode: 'tokens',
                  tokens: this.action.pedido.pedido.usuario_token,
                  clave: ''
                };
                
                this.database.send_notification (push_data).subscribe (response => {
                }, error => {
                });
              })
              .catch ((error: any) => {
                console.log (error);
              });
          }
        }
      ]
    });

    await alert.present();
  }

  async open_checklist_pedido (pedido: any, pedido_siguiente: any) {
    const modal = await this.modalController.create({
      component: PedidoChecklistPage,
      mode: 'ios',
      componentProps: {
        item: pedido,
        pedido_siguiente: pedido_siguiente
      }
    });

    modal.onDidDismiss ().then (async (response: any) => {
      if (response.role === 'ok') {
        const loading = await this.loadingCtrl.create ({
          message: 'Cargando información...'
        });
    
        loading.present ();

        this.check_pedidos (loading);
      }
    });

    return await modal.present();
  }
}
