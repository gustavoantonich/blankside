import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { combineLatest, map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Diseno } from '../models/diseno';
import { MisDisenosService, DisenoPropio } from './mis-disenos.service';
import { FotosService, Foto } from './fotos.service';

export type { Diseno } from '../models/diseno';

@Injectable({
  providedIn: 'root',
})
export class DisenosService {
  private readonly apiUrl = environment.apiDisenos;

  constructor(
    private readonly http: HttpClient,
    private readonly misDisenosService: MisDisenosService,
    private readonly fotosService: FotosService,
  ) {}

  /** JSON base + diseños propios, con la imagen resuelta desde FotosService. */
  obtenerDisenos(): Observable<Diseno[]> {
    return combineLatest([
      this.http.get<Diseno[]>(this.apiUrl),
      this.misDisenosService.propios$,
      this.fotosService.fotos$,
    ]).pipe(
      map(([base, propios, fotos]) => [
        ...this.publicar(propios, fotos),
        ...base,
      ]),
    );
  }

  /** Solo los diseños creados por el usuario, para Mi Studio. */
  obtenerMisDisenos(): Observable<Diseno[]> {
    return combineLatest([
      this.misDisenosService.propios$,
      this.fotosService.fotos$,
    ]).pipe(map(([propios, fotos]) => this.publicar(propios, fotos)));
  }

  private publicar(propios: DisenoPropio[], fotos: Foto[]): Diseno[] {
    return propios.flatMap(({ fotoId, ...datos }) => {
      const foto = fotos.find((item) => item.id === fotoId);

      if (!foto) {
        return [];
      }

      return [{ ...datos, imagen: foto.displayUrl, propio: true }];
    });
  }
}
