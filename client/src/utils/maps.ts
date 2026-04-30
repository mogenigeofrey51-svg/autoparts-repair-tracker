export function googleMapsSearchUrl(address?: string | null) {
  if (!address?.trim()) {
    return "";
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}
