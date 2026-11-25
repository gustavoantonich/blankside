import { Component, OnDestroy, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonCheckbox,
  IonChip,
  IonCol,
  IonContent,
  IonFab,
  IonFabButton,
  IonGrid,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonRow,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/angular';

import { DisenosService } from '../services/disenos.service';
import { MisDisenosService } from '../services/mis-disenos.service';
import { FotosService, type Foto } from '../services/fotos.service';
import type { Diseno } from '../models/diseno';
import { ProductoPreviewComponent } from '../components/producto-preview/producto-preview.component';

interface FormularioDiseno {
  nombre: string;
  artista: string;
  categoria: string;
  descripcion: string;
  precio: number | string;
  producto: string;
  tags: string;
  destacado: boolean;
}

@Component({
  selector: 'app-tab2',
  templateUrl: './tab2.page.html',
  styleUrls: ['./tab2.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
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
    IonModal,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonChip,
    IonSegment,
    IonSegmentButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonCheckbox,
    IonNote,
    IonToast,
    ProductoPreviewComponent,
  ],
})
export class Tab2Page implements OnDestroy {
  readonly productos = [
    'Camiseta',
    'Funda de teléfono',
    'Poster',
    'Taza',
    'Sticker',
  ];
  readonly categorias = [
    'Street Art',
    'Digital Art',
    'Abstracto',
    'Retro',
    'Naturaleza',
    'Otro',
  ];

  readonly fotos: Signal<Foto[]>;
  readonly cargando: Signal<boolean>;
  readonly misDisenos: Signal<Diseno[]>;
  readonly guardando = signal(false);

  readonly imagenPreview = signal('assets/disenos/urbano.svg');
  readonly fotoElegida = signal<Foto | null>(null);
  readonly dataUrlPendiente = signal<string | null>(null);

  form: FormularioDiseno = this.nuevoFormulario();
  modalAbierto = false;
  toastAbierto = false;
  toastMensaje = '';

  private blobPreview?: string;

  constructor(
    private readonly fotosService: FotosService,
    private readonly disenosService: DisenosService,
    private readonly misDisenosService: MisDisenosService,
  ) {
    this.fotos = toSignal(this.fotosService.fotos$, { initialValue: [] as Foto[] });
    this.cargando = toSignal(this.fotosService.cargando$, { initialValue: true });
    this.misDisenos = toSignal(this.disenosService.obtenerMisDisenos(), {
      initialValue: [] as Diseno[],
    });
  }

  ngOnDestroy(): void {
    this.revocarPreview();
  }

  get puedeGuardar(): boolean {
    return (
      this.form.nombre.trim().length > 0 &&
      (this.fotoElegida() !== null || this.dataUrlPendiente() !== null)
    );
  }

  async tomarFoto(): Promise<void> {
    await this.fotosService.agregarDesdeCamara();
  }

  async agregarDesdeDirectorio(): Promise<void> {
    await this.fotosService.agregarDesdeDirectorio();
  }

  async borrarFoto(foto: Foto): Promise<void> {
    await this.fotosService.borrarFoto(foto);
  }

  borrarDiseno(diseno: Diseno): void {
    this.misDisenosService.quitar(diseno.id);
    this.mostrarToast('Diseño quitado de tu catálogo');
  }

  abrirModal(): void {
    this.form = this.nuevoFormulario();
    this.fotoElegida.set(null);
    this.dataUrlPendiente.set(null);
    this.reemplazarPreview('assets/disenos/urbano.svg');
    this.modalAbierto = true;
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.revocarPreview();
  }

  async subirImagen(): Promise<void> {
    const archivo = await this.elegirArchivo();

    if (!archivo) {
      return;
    }

    try {
      const dataUrl = await this.leerArchivo(archivo);
      this.fotoElegida.set(null);
      this.dataUrlPendiente.set(dataUrl);
      this.reemplazarPreview(this.dataUrlABlobUrl(dataUrl));
    } catch (err) {
      console.error('No se pudo leer la imagen:', err);
      this.mostrarToast('No se pudo leer esa imagen');
    }
  }

  async tomarFotoDiseno(): Promise<void> {
    const foto = await this.fotosService.agregarDesdeCamara();

    if (foto) {
      this.seleccionarFoto(foto);
    } else {
      this.mostrarToast('No se obtuvo ninguna foto');
    }
  }

  seleccionarFoto(foto: Foto): void {
    this.dataUrlPendiente.set(null);
    this.fotoElegida.set(foto);
    this.reemplazarPreview(foto.displayUrl);
  }

  onProductoPreview(event: CustomEvent<{ value?: string | number }>): void {
    this.form.producto = String(event.detail.value ?? 'Camiseta');
  }

  async guardarDiseno(): Promise<void> {
    if (!this.puedeGuardar || this.guardando()) {
      return;
    }

    this.guardando.set(true);

    try {
      let foto = this.fotoElegida();

      if (!foto) {
        foto = await this.fotosService.guardarDiseno(
          this.dataUrlPendiente()!,
          `${this.form.nombre.trim() || 'diseno'}.png`,
        );
      }

      if (!foto) {
        this.mostrarToast('No se pudo guardar el diseño');
        return;
      }

      this.misDisenosService.agregar({
        nombre: this.form.nombre.trim(),
        artista: this.form.artista.trim() || 'Vos',
        categoria: this.form.categoria || 'Otro',
        descripcion: this.form.descripcion.trim() || 'Diseño creado en Mi Studio.',
        precio: Number(this.form.precio) || 0,
        producto: this.form.producto,
        destacado: this.form.destacado,
        tags: this.form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        fotoId: foto.id,
      });

      this.mostrarToast('Tu diseño ya está en Explorar');
      this.cerrarModal();
    } catch (err) {
      console.error('No se pudo publicar el diseño:', err);
      this.mostrarToast('No se pudo publicar el diseño');
    } finally {
      this.guardando.set(false);
    }
  }

  trackByFoto(_index: number, foto: Foto): string {
    return foto.id;
  }

  trackByDiseno(_index: number, diseno: Diseno): number {
    return diseno.id;
  }

  private nuevoFormulario(): FormularioDiseno {
    return {
      nombre: '',
      artista: '',
      categoria: 'Street Art',
      descripcion: '',
      precio: 45000,
      producto: 'Camiseta',
      tags: '',
      destacado: false,
    };
  }

  private elegirArchivo(): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';

      const limpiar = () => input.remove();

      input.addEventListener('change', () => {
        const archivo = input.files?.[0] ?? null;
        limpiar();
        resolve(archivo);
      });

      input.addEventListener('cancel', () => {
        limpiar();
        resolve(null);
      });

      document.body.appendChild(input);
      input.click();
    });
  }

  private leerArchivo(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result));
      lector.onerror = () => reject(lector.error);
      lector.readAsDataURL(archivo);
    });
  }

  private dataUrlABlobUrl(dataUrl: string): string {
    const coincidencia = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);

    if (!coincidencia) {
      return dataUrl;
    }

    const mime = coincidencia[1];
    const binario = atob(coincidencia[2]);
    const bytes = new Uint8Array(binario.length);

    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }

    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  }

  private reemplazarPreview(url: string): void {
    this.revocarPreview();
    this.imagenPreview.set(url);
    this.blobPreview = url.startsWith('blob:') ? url : undefined;
  }

  private revocarPreview(): void {
    if (this.blobPreview) {
      URL.revokeObjectURL(this.blobPreview);
      this.blobPreview = undefined;
    }
  }

  private mostrarToast(mensaje: string): void {
    this.toastMensaje = mensaje;
    this.toastAbierto = true;
  }
}
