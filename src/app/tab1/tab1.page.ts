
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/angular';

import { DisenosService, Diseno } from '../services/disenos.service';

@Component({
  selector: 'app-tab1',
  templateUrl: './tab1.page.html',
  styleUrls: ['./tab1.page.scss'],
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonSpinner,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    CommonModule,
    FormsModule
  ],
})
export class Tab1Page implements OnInit {

  disenos: Diseno[] = [];
  cargando = true;
  error = false;

  constructor(private disenosService: DisenosService) {}

  ngOnInit() {
    this.cargarDisenos();
  }

  cargarDisenos() {
    this.cargando = true;
    this.error = false;

    this.disenosService.obtenerDisenos().subscribe({
      next: (datos) => {
        this.disenos = datos;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar los diseños:', error);
        this.error = true;
        this.cargando = false;
      }
    });
  }
}
