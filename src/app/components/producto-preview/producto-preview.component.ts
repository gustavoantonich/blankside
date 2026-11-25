import { Component, Input } from '@angular/core';

export type TipoProducto = 'camiseta' | 'funda' | 'poster' | 'taza' | 'sticker';

let contadorPreviews = 0;

@Component({
  selector: 'app-producto-preview',
  standalone: true,
  templateUrl: './producto-preview.component.html',
  styleUrls: ['./producto-preview.component.scss'],
})
export class ProductoPreviewComponent {
  @Input({ required: true }) imagen!: string;
  @Input({ required: true }) producto!: string;

  /** Ids únicos por instancia para queclipPaths y filtros no colisionen. */
  private readonly uid = `pv-${contadorPreviews++}`;

  get clip(): string {
    return `clip-${this.uid}`;
  }

  get impresion(): string {
    return `impresion-${this.uid}`;
  }

  get fondo(): string {
    return `fondo-${this.uid}`;
  }

  get tela(): string {
    return `tela-${this.uid}`;
  }

  get brillo(): string {
    return `brillo-${this.uid}`;
  }

  get sombra(): string {
    return `sombra-${this.uid}`;
  }

  get textura(): string {
    return `textura-${this.uid}`;
  }

  get tipo(): TipoProducto {
    const nombre = (this.producto ?? '').toLocaleLowerCase('es');

    if (nombre.includes('camis') || nombre.includes('remer')) return 'camiseta';
    if (nombre.includes('funda') || nombre.includes('celular') || nombre.includes('phone')) {
      return 'funda';
    }
    if (nombre.includes('poster') || nombre.includes('afiche')) return 'poster';
    if (nombre.includes('taza') || nombre.includes('mug')) return 'taza';
    return 'sticker';
  }
}
