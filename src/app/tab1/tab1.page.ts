import { Component, OnInit, computed, signal } from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';

import { DisenosService } from '../services/disenos.service';
import type { Diseno } from '../models/diseno';
import { FavoritosService } from '../services/favoritos.service';
import { ProductoPreviewComponent } from '../components/producto-preview/producto-preview.component';

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
    IonIcon,
    IonToast,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonChip,
    IonBadge,
    ProductoPreviewComponent,
  ],
})
export class Tab1Page implements OnInit {
  readonly productos = [
    'Camiseta',
    'Funda de teléfono',
    'Poster',
    'Taza',
    'Sticker',
  ];
  readonly segmentos = ['todos', ...this.productos];

  readonly disenos = signal<Diseno[]>([]);
  readonly cargando = signal(true);
  readonly error = signal(false);
  readonly termino = signal('');
  readonly productoActivo = signal('todos');

  readonly disenosFiltrados = computed(() => {
    const busqueda = this.termino().trim().toLocaleLowerCase('es');
    const producto = this.productoActivo();

    return this.disenos().filter((diseno) => {
      const coincideProducto =
        producto === 'todos' || diseno.producto === producto;
      const texto = [
        diseno.nombre,
        diseno.artista,
        diseno.descripcion,
        diseno.categoria,
        diseno.producto,
        ...diseno.tags,
      ]
        .join(' ')
        .toLocaleLowerCase('es');

      return coincideProducto && (!busqueda || texto.includes(busqueda));
    });
  });

  readonly sinResultados = computed(
    () => this.disenos().length > 0 && this.disenosFiltrados().length === 0,
  );

  toastAbierto = false;
  toastMensaje = '';

  constructor(
    private readonly disenosService: DisenosService,
    private readonly favoritosService: FavoritosService,
  ) {}

  ngOnInit(): void {
    this.cargarDisenos();
  }

  cargarDisenos(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.disenosService.obtenerDisenos().subscribe({
      next: (datos) => {
        this.disenos.set(datos);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar los diseños:', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  onBusqueda(event: CustomEvent<{ value?: string | null }>): void {
    this.termino.set(event.detail.value ?? '');
  }

  onProducto(event: CustomEvent<{ value?: string | number }>): void {
    this.productoActivo.set(String(event.detail.value ?? 'todos'));
  }

  limpiarFiltros(): void {
    this.termino.set('');
    this.productoActivo.set('todos');
  }

  esFavorito(id: number): boolean {
    return this.favoritosService.esFavorito(id);
  }

  toggleFavorito(diseno: Diseno): void {
    const agregado = this.favoritosService.toggle(diseno);
    this.toastMensaje = agregado
      ? 'Diseño agregado a favoritos'
      : 'Diseño quitado de favoritos';
    this.toastAbierto = true;
  }
}
