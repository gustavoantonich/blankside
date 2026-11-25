import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Metadatos de un diseño creado por el usuario. La imagen binaria vive en
 * FotosService; acá solo guardamos la referencia por id para no duplicar bytes.
 */
export interface DisenoPropio {
  id: number;
  nombre: string;
  artista: string;
  categoria: string;
  descripcion: string;
  precio: number;
  producto: string;
  destacado: boolean;
  tags: string[];
  fotoId: string;
}

export type DatosDisenoPropio = Omit<DisenoPropio, 'id'>;

const CLAVE_STORAGE = 'blankside_mis_disenos_v1';

@Injectable({
  providedIn: 'root',
})
export class MisDisenosService {
  private readonly subject = new BehaviorSubject<DisenoPropio[]>(this.leer());

  readonly propios$ = this.subject.asObservable();

  get propios(): DisenoPropio[] {
    return this.subject.value;
  }

  agregar(datos: DatosDisenoPropio): DisenoPropio {
    let id = Date.now();

    while (this.subject.value.some((diseno) => diseno.id === id)) {
      id += 1;
    }

    const diseno: DisenoPropio = { ...datos, id };
    this.guardar([diseno, ...this.subject.value]);
    return diseno;
  }

  quitar(id: number): void {
    this.guardar(this.subject.value.filter((diseno) => diseno.id !== id));
  }

  private guardar(disenos: DisenoPropio[]): void {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(disenos));
    this.subject.next(disenos);
  }

  private leer(): DisenoPropio[] {
    try {
      const datos = localStorage.getItem(CLAVE_STORAGE);

      if (!datos) {
        return [];
      }

      const parsed: unknown = JSON.parse(datos);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (item): item is DisenoPropio =>
          !!item &&
          typeof item.id === 'number' &&
          typeof item.nombre === 'string' &&
          typeof item.fotoId === 'string',
      );
    } catch {
      return [];
    }
  }
}
