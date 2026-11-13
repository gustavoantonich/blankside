import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  Camera,
  CameraDirection,
  CameraResultType,
  CameraSource,
} from '@capacitor/camera';

export interface CapturaCamara {
  nombre: string;
  dataUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ServicioDeCamaraService {
  /**
   * Abre la cámara y devuelve la imagen capturada como DataUrl (base64).
   * - En Android/iOS usa la cámara nativa de Capacitor.
   * - En el navegador muestra el modal de cámara (PWA Elements / webcam).
   */
  async tomarFotoConCamara(): Promise<CapturaCamara | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const estado = await Camera.checkPermissions();

        if (estado.camera !== 'granted') {
          const pedido = await Camera.requestPermissions({
            permissions: ['camera'],
          });

          if (pedido.camera !== 'granted') {
            console.error(
              '[ServicioDeCamara] Permiso de cámara denegado por el usuario.',
            );
            return null;
          }
        }
      }

      const foto = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
        width: 1200,
      });

      if (!foto.dataUrl) {
        console.error('[ServicioDeCamara] La cámara no devolvió la imagen.');
        return null;
      }

      return {
        nombre: `camara_${Date.now()}.jpg`,
        dataUrl: foto.dataUrl,
      };
    } catch (error) {
      const mensaje = String((error as { message?: string })?.message ?? error);

      if (/cancel/i.test(mensaje)) {
        console.info('[ServicioDeCamara] Captura cancelada por el usuario.');
      } else {
        console.error('[ServicioDeCamara] No se pudo obtener la foto:', error);
      }

      return null;
    }
  }
}
