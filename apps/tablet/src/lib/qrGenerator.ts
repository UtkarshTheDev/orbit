/**
 * QR Code Generation Utility
 * Generates QR codes for map navigation with destination parameters
 */

/**
 * Generate a QR code data URL for a given destination
 * @param destinationId - The location ID to navigate to
 * @param baseUrl - Base URL of the deployed app (defaults to current origin)
 * @returns Promise<string> - Data URL of the generated QR code image
 */
export async function generateNavigationQR(
  destinationId: string,
  baseUrl?: string
): Promise<string> {
  // Use provided baseUrl or fallback to current origin
  const url = baseUrl || window.location.origin;
  
  // Construct the navigation URL with destination query parameter
  const navigationUrl = `${url}/map?destination=${encodeURIComponent(destinationId)}`;
  
  // Use QRCode library to generate QR code
  // We'll use qrcode library which is lightweight and works well
  try {
    const QRCode = await import('qrcode');
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(navigationUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e40af', // Blue-800 for better brand consistency
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('[QR Generator] Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Get the full navigation URL for a destination
 * @param destinationId - The location ID to navigate to
 * @param baseUrl - Base URL of the deployed app (defaults to current origin)
 * @returns string - Full navigation URL
 */
export function getNavigationUrl(
  destinationId: string,
  baseUrl?: string
): string {
  const url = baseUrl || window.location.origin;
  return `${url}/map?destination=${encodeURIComponent(destinationId)}`;
}
