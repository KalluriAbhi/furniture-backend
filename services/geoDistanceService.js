const WAREHOUSE_LAT = 17.385043;
const WAREHOUSE_LNG = 78.486671;

function calculateDistanceKm(lat1, lon1, lat2 = WAREHOUSE_LAT, lon2 = WAREHOUSE_LNG) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function evaluateDelivery(distanceKm) {
  if (distanceKm <= 200) {
    const baseRate = 500;
    const perKmRate = 15;
    const extraKm = Math.max(0, distanceKm - 20);
    const charge = Math.round(baseRate + (extraKm * perKmRate));

    return {
      type: 'radius_auto',
      charge: charge,
      requiresQuotation: false,
      message: `Delivery fee calculated for ${distanceKm.toFixed(1)} km.`
    };
  } else {
    return {
      type: 'custom_quotation',
      charge: 0,
      requiresQuotation: true,
      message: `Destination exceeds 200 km (${distanceKm.toFixed(1)} km). Custom delivery quotation required.`
    };
  }
}

module.exports = { calculateDistanceKm, evaluateDelivery };