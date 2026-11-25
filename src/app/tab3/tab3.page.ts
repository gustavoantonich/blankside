import { Component, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonToast,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge
} from '@ionic/angular';

import { FavoritosService } from '../services/favoritos.service';
import { Diseno } from '../models/diseno';
import { ProductoPreviewComponent } from '../components/producto-preview/producto-preview.component';

@Component({
  selector: 'app-tab3',
  templateUrl: './tab3.page.html',
  styleUrls: ['./tab3.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonToast,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonBadge,
    CommonModule,
    ProductoPreviewComponent
  ],
})
export class Tab3Page {

  readonly favoritos: Signal<Diseno[]>;
  toastAbierto = false;
  toastMensaje = '';

  constructor(private favoritosService: FavoritosService) {
    this.favoritos = toSignal(this.favoritosService.favoritos$, {
      initialValue: this.favoritosService.obtenerFavoritos()
    });
  }

  quitarFavorito(diseno: Diseno): void {
    this.favoritosService.quitar(diseno.id);

    this.toastMensaje = 'Diseño quitado de favoritos';
    this.toastAbierto = true;
  }
}
