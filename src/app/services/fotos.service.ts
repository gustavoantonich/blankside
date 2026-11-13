import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { ServicioDeCamaraService } from './servicedecamara.service';

export interface Foto {
  id: string;
  nombre: string;
  /** Puntero persistido: assets/fotos/archivo.jpg o una URL remota. */
  url: string;
  /** Ruta del archivo dentro del directorio de la app. */
  ruta?: string;
  /** Directorio de Capacitor donde vive el archivo (DATA, DOCUMENTS, etc.). */
  directorio?: Directory;
  origen: 'camara' | 'directorio' | 'remota';
  /** URL lista para usar en <img>. No se persiste. */
  displayUrl: string;
}

type FotoGuardada = Omit<Foto, 'displayUrl'>;

const CARPETA_FOTOS = 'assets/fotos';
const ARCHIVO_INDICE = `${CARPETA_FOTOS}/index.json`;
const DIRECTORIO = Directory.Data;
const VERSION_INDICE = 1;

const FOTOS_INICIALES: FotoGuardada[] = Array.from({ length: 7 }, (_, i) => {
  const numero = i + 1;
  const url = `https://picsum.photos/seed/${numero}/600/600`;

  return {
    id: `inicial-${numero}`,
    nombre: `foto_${numero}.jpg`,
    url,
    origen: 'remota' as const,
  };
});

@Injectable({
  providedIn: 'root',
})
export class FotosService {
  private readonly _fotos = new BehaviorSubject<Foto[]>([]);
  private readonly _cargando = new BehaviorSubject<boolean>(true);
  private inicializacion?: Promise<void>;

  /** La vista se suscribe a este observable y se actualiza sola. */
  readonly fotos$: Observable<Foto[]> = this._fotos.asObservable();
  readonly cargando$: Observable<boolean> = this._cargando.asObservable();

  constructor(private readonly camara: ServicioDeCamaraService) {
    void this.inicializar();
  }

  get fotos(): Foto[] {
    return this._fotos.value;
  }

  /** Carga (una sola vez) el índice guardado y los archivos del disco. */
  inicializar(): Promise<void> {
    if (!this.inicializacion) {
      this.inicializacion = this.cargar();
    }

    return this.inicializacion;
  }

  async recargar(): Promise<void> {
    this.inicializacion = this.cargar();
    return this.inicializacion;
  }

  /** Toma una foto, la guarda en disco y actualiza la lista al instante. */
  async agregarDesdeCamara(): Promise<Foto | null> {
    const captura = await this.camara.tomarFotoConCamara();

    if (!captura) {
      return null;
    }

    await this.inicializar();
    return this.guardarDataUrl(captura.nombre, captura.dataUrl, 'camara');
  }

  /** Abre el explorador de archivos, guarda las imágenes y actualiza la lista. */
  async agregarDesdeDirectorio(): Promise<Foto[]> {
    const archivos = await this.seleccionarArchivos();

    if (archivos.length === 0) {
      return [];
    }

    await this.inicializar();

    const agregadas: Foto[] = [];

    for (const archivo of archivos) {
      if (!archivo.type.startsWith('image/')) {
        continue;
      }

      const dataUrl = await this.leerArchivoComoDataUrl(archivo);
      const foto = await this.guardarDataUrl(
        archivo.name,
        dataUrl,
        'directorio',
      );

      if (foto) {
        agregadas.push(foto);
      }
    }

    return agregadas;
  }

  /** Borra la imagen del disco (si tiene ruta y directorio) y de la lista. */
  async borrarFoto(foto: Foto): Promise<void> {
    // Actualiza la lista primero para que la UI responda al instante.
    this._fotos.next(this._fotos.value.filter((item) => item.id !== foto.id));
    this.revocarUrl(foto.displayUrl);

    if (foto.ruta) {
      try {
        await Filesystem.deleteFile({
          path: foto.ruta,
          directory: foto.directorio ?? DIRECTORIO,
        });
      } catch (error) {
        console.warn(
          `[FotosService] No se pudo borrar el archivo ${foto.ruta}:`,
          error,
        );
      }
    }

    await this.persistir();
  }

  private async cargar(): Promise<void> {
    this._cargando.next(true);

    try {
      await this.asegurarCarpeta();

      const guardadas = await this.leerIndice();
      const base = guardadas ?? FOTOS_INICIALES;
      const fotos = await this.resolverFotos(base);

      this._fotos.next(fotos);

      // Primera ejecución: guardamos el índice inicial.
      if (!guardadas) {
        await this.persistir();
      }
    } catch (error) {
      console.error('[FotosService] Error al cargar la galería:', error);
      this._fotos.next(
        FOTOS_INICIALES.map((foto) => ({
          ...foto,
          displayUrl: foto.url,
        })),
      );
    } finally {
      this._cargando.next(false);
    }
  }

  private async guardarDataUrl(
    nombreOriginal: string,
    dataUrl: string,
    origen: 'camara' | 'directorio',
  ): Promise<Foto | null> {
    try {
      const { mime, base64 } = this.separarDataUrl(dataUrl);
      const extension = this.extensionDeMime(mime);
      const id = this.generarId();
      const nombre = `${id}.${extension}`;
      const ruta = `${CARPETA_FOTOS}/${nombre}`;

      // Guarda solo el archivo binario en disco. En el índice queda la ruta.
      await Filesystem.writeFile({
        path: ruta,
        data: base64,
        directory: DIRECTORIO,
        recursive: true,
      });

      const displayUrl = await this.crearUrlVisual(ruta, dataUrl);
      const foto: Foto = {
        id,
        nombre: nombreOriginal || nombre,
        url: ruta,
        ruta,
        directorio: DIRECTORIO,
        origen,
        displayUrl,
      };

      // Notifica a la vista inmediatamente (sin recargar la página).
      this._fotos.next([foto, ...this._fotos.value]);
      await this.persistir();

      return foto;
    } catch (error) {
      console.error('[FotosService] No se pudo guardar la imagen:', error);
      return null;
    }
  }

  private async resolverFotos(guardadas: FotoGuardada[]): Promise<Foto[]> {
    const fotos: Foto[] = [];

    for (const guardada of guardadas) {
      if (!guardada.ruta) {
        fotos.push({ ...guardada, displayUrl: guardada.url });
        continue;
      }

      try {
        const displayUrl = await this.crearUrlVisual(guardada.ruta);
        fotos.push({ ...guardada, displayUrl });
      } catch (error) {
        console.warn(
          `[FotosService] Falta el archivo ${guardada.ruta}, se omite.`,
          error,
        );
      }
    }

    return fotos;
  }

  private async crearUrlVisual(ruta: string, dataUrl?: string): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      const { uri } = await Filesystem.getUri({
        path: ruta,
        directory: DIRECTORIO,
      });

      return Capacitor.convertFileSrc(uri);
    }

    // En web no se puede apuntar directo a IndexedDB: usamos un Blob URL.
    if (dataUrl) {
      return this.dataUrlABlobUrl(dataUrl);
    }

    const { data } = await Filesystem.readFile({
      path: ruta,
      directory: DIRECTORIO,
    });

    if (typeof data === 'string') {
      return this.base64ABlobUrl(data, this.mimeDeRuta(ruta));
    }

    return URL.createObjectURL(data);
  }

  private async persistir(): Promise<void> {
    const guardadas: FotoGuardada[] = this._fotos.value.map((foto) => ({
      id: foto.id,
      nombre: foto.nombre,
      url: foto.url,
      ruta: foto.ruta,
      directorio: foto.directorio,
      origen: foto.origen,
    }));

    try {
      await Filesystem.writeFile({
        path: ARCHIVO_INDICE,
        data: JSON.stringify(
          { version: VERSION_INDICE, fotos: guardadas },
          null,
          2,
        ),
        directory: DIRECTORIO,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    } catch (error) {
      console.error('[FotosService] No se pudo guardar el índice:', error);
    }
  }

  private async leerIndice(): Promise<FotoGuardada[] | null> {
    try {
      const { data } = await Filesystem.readFile({
        path: ARCHIVO_INDICE,
        directory: DIRECTORIO,
        encoding: Encoding.UTF8,
      });

      if (typeof data !== 'string') {
        return null;
      }

      const json = JSON.parse(data) as { fotos?: FotoGuardada[] };

      return Array.isArray(json.fotos) ? json.fotos : null;
    } catch {
      // Todavía no existe el índice.
      return null;
    }
  }

  private async asegurarCarpeta(): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: CARPETA_FOTOS,
        directory: DIRECTORIO,
        recursive: true,
      });
    } catch {
      // La carpeta ya existe.
    }
  }

  /** Crea un <input type="file"> temporal y espera a que el usuario elija. */
  private seleccionarArchivos(): Promise<File[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      input.style.display = 'none';

      const limpiar = () => input.remove();

      input.addEventListener('change', () => {
        const archivos = Array.from(input.files ?? []);
        limpiar();
        resolve(archivos);
      });

      input.addEventListener('cancel', () => {
        limpiar();
        resolve([]);
      });

      document.body.appendChild(input);
      input.click();
    });
  }

  private leerArchivoComoDataUrl(archivo: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result));
      lector.onerror = () => reject(lector.error);
      lector.readAsDataURL(archivo);
    });
  }

  private separarDataUrl(dataUrl: string): { mime: string; base64: string } {
    const coincidencia = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl);

    if (!coincidencia) {
      throw new Error('La imagen no está en formato DataUrl base64.');
    }

    return { mime: coincidencia[1], base64: coincidencia[2] };
  }

  private extensionDeMime(mime: string): string {
    const mapa: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/heic': 'heic',
      'image/heif': 'heif',
    };

    return mapa[mime.toLowerCase()] ?? 'jpg';
  }

  private mimeDeRuta(ruta: string): string {
    const extension = ruta.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mapa: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
      heic: 'image/heic',
      heif: 'image/heif',
    };

    return mapa[extension] ?? 'image/jpeg';
  }

  private dataUrlABlobUrl(dataUrl: string): string {
    const { mime, base64 } = this.separarDataUrl(dataUrl);
    return this.base64ABlobUrl(base64, mime);
  }

  private base64ABlobUrl(base64: string, mime: string): string {
    const binario = atob(base64);
    const bytes = new Uint8Array(binario.length);

    for (let i = 0; i < binario.length; i++) {
      bytes[i] = binario.charCodeAt(i);
    }

    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  }

  private revocarUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  private generarId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `foto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
