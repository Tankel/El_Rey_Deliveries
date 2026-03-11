import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

type PickStoredImageResult = {
  ok: boolean;
  uri?: string;
  message: string;
  cancelled?: boolean;
};

function getExtensionFromUri(uri: string) {
  const clean = uri.split('?')[0] ?? uri;
  const dot = clean.lastIndexOf('.');
  if (dot === -1) {
    return 'jpg';
  }
  const ext = clean.slice(dot + 1).toLowerCase();
  return ext || 'jpg';
}

async function ensureDirectory(path: string) {
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  }
}

export async function pickAndStoreImage(scope: 'products' | 'delivery-proof'): Promise<PickStoredImageResult> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return {
        ok: false,
        message: 'Se requieren permisos de galeria para seleccionar imagen.',
      };
    }

    const selection = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.82,
      mediaTypes: ['images'],
    });

    if (selection.canceled || !selection.assets?.length) {
      return {
        ok: false,
        cancelled: true,
        message: 'Seleccion cancelada.',
      };
    }

    const sourceUri = selection.assets[0]?.uri;
    if (!sourceUri) {
      return {
        ok: false,
        message: 'No se pudo leer la imagen seleccionada.',
      };
    }

    const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
    if (!baseDirectory) {
      return {
        ok: false,
        message: 'No se encontro almacenamiento disponible en el dispositivo.',
      };
    }

    const folder = `${baseDirectory}uploads/${scope}/`;
    await ensureDirectory(folder);
    const extension = getExtensionFromUri(sourceUri);
    const targetUri = `${folder}${Date.now()}-${Math.random().toString(16).slice(2, 8)}.${extension}`;
    await FileSystem.copyAsync({ from: sourceUri, to: targetUri });

    return {
      ok: true,
      uri: targetUri,
      message: 'Imagen guardada.',
    };
  } catch (error) {
    return {
      ok: false,
      message: `No se pudo seleccionar la imagen: ${String(error)}`,
    };
  }
}
