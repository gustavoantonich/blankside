import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { Diseno } from '../models/diseno';

const CLAVE_STORAGE = 'blankside_favoritos';

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {

  private readonly favoritosSubject = new BehaviorSubject<Diseno[]>(this.leerFavoritos());

  readonly favoritos$ = this.favoritosSubject.asObservable();

  obtenerFavoritos(): Diseno[] {
    return this.favoritosSubject.value;
  }

  esFavorito(id: number): boolean {
    return this.favoritosSubject.value.some((diseno) => diseno.id === id);
  }

  toggle(diseno: Diseno): boolean {
    if (this.esFavorito(diseno.id)) {
      this.quitar(diseno.id);
      return false;
    }

    this.guardar([...this.favoritosSubject.value, diseno]);
    return true;
  }

  quitar(id: number): void {
    this.guardar(this.favoritosSubject.value.filter((diseno) => diseno.id !== id));
  }

  private guardar(favoritos: Diseno[]): void {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(favoritos));
    this.favoritosSubject.next(favoritos);
  }

  private leerFavoritos(): Diseno[] {
    try {
      const datos = localStorage.getItem(CLAVE_STORAGE);

      if (!datos) {
        return [];
      }

      const favoritos = JSON.parse(datos);

      return Array.isArray(favoritos)
        ? favoritos.filter((diseno) => diseno && typeof diseno.id === 'number')
        : [];
    } catch {
      return [];
    }
  }
}
