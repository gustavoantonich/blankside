import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface Diseno {
  id: number;
  nombre: string;
  artista: string;
  categoria: string;
  descripcion: string;
  imagen: string;
  precio: number;
  producto: string;
  destacado: boolean;
  tags: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DisenosService {

  private apiUrl = environment.apiDisenos;

  constructor(private http: HttpClient) {}

  obtenerDisenos(): Observable<Diseno[]> {
    return this.http.get<Diseno[]>(this.apiUrl);
  }
}