import { Component, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  IonSpinner,
} from '@ionic/angular';
import { FotosService } from '../services/fotos.service';
import type { Foto } from '../services/fotos.service';

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton,
    IonSpinner,
    CommonModule,
  ],
})
export class Tab2Page {
  readonly fotos: Signal<Foto[]>;
  readonly cargando: Signal<boolean>;
  readonly guardando = signal(false);

  constructor(private fotosService: FotosService) {
    this.fotos = toSignal(this.fotosService.fotos$, {
      initialValue: [] as Foto[],
    });
    this.cargando = toSignal(this.fotosService.cargando$, {
      initialValue: true,
    });
  }

  async tomarFoto(): Promise<void> {
    if (this.guardando()) {
      return;
    }

    this.guardando.set(true);

    try {
      await this.fotosService.agregarDesdeCamara();
    } finally {
      this.guardando.set(false);
    }
  }

  async agregarDesdeDirectorio(): Promise<void> {
    if (this.guardando()) {
      return;
    }

    this.guardando.set(true);

    try {
      await this.fotosService.agregarDesdeDirectorio();
    } finally {
      this.guardando.set(false);
    }
  }

  async borrarFoto(foto: Foto): Promise<void> {
    await this.fotosService.borrarFoto(foto);
  }

  trackByFoto(_index: number, foto: Foto): string {
    return foto.id;
  }
}
