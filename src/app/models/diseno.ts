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
  /** Marca los diseños creados por el usuario en Mi Studio. */
  propio?: boolean;
  /** Id de la imagen guardada en FotosService (solo diseños propios). */
  fotoId?: string;
}
