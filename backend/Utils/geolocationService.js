/**
 * Local Geocoding Service
 * Converts GPS coordinates to general area/city name without external APIs
 * Uses local coordinate-based lookup tables
 */

const EGYPT_CITIES = [
    { name: 'القاهرة', lat: 30.0444, lng: 31.2357, radius: 50 },
    { name: 'الإسكندرية', lat: 31.2001, lng: 29.9187, radius: 30 },
    { name: 'الجيزة', lat: 30.0131, lng: 31.2089, radius: 40 },
    { name: 'طنطا', lat: 30.9728, lng: 31.0013, radius: 20 },
    { name: 'المنصورة', lat: 31.0425, lng: 31.3807, radius: 20 },
    { name: 'الزقازيق', lat: 30.5667, lng: 31.5000, radius: 20 },
    { name: 'بنها', lat: 30.4667, lng: 31.1833, radius: 15 },
    { name: 'شبرا الخيمة', lat: 30.1333, lng: 31.2333, radius: 15 },
    { name: 'المحلة الكبرى', lat: 30.9667, lng: 31.1667, radius: 20 },
    { name: 'أسيوط', lat: 27.1856, lng: 31.1405, radius: 25 },
    { name: 'سوهاج', lat: 26.5607, lng: 31.6918, radius: 25 },
    { name: 'قنا', lat: 26.1642, lng: 32.7264, radius: 25 },
    { name: 'الأقصر', lat: 25.6872, lng: 32.6396, radius: 20 },
    { name: 'أسوان', lat: 24.0889, lng: 32.8998, radius: 30 },
    { name: 'الفيوم', lat: 29.3708, lng: 30.8698, radius: 20 },
    { name: 'بني سويف', lat: 29.0641, lng: 31.1245, radius: 20 },
    { name: 'المنيا', lat: 28.3700, lng: 30.7000, radius: 25 },
    { name: 'الوادي الجديد', lat: 25.5000, lng: 30.5000, radius: 100 },
    { name: 'السويس', lat: 30.0050, lng: 32.5500, radius: 20 },
    { name: 'الإسماعيلية', lat: 30.2333, lng: 31.9500, radius: 20 },
    { name: 'بورسعيد', lat: 30.6833, lng: 32.3000, radius: 15 },
    { name: 'دمياط', lat: 31.4167, lng: 31.8167, radius: 15 },
    { name: 'الشرقية', lat: 30.2833, lng: 31.7000, radius: 20 },
    { name: 'كفر الشيخ', lat: 31.1167, lng: 30.1333, radius: 20 },
    { name: 'البحيرة', lat: 30.4667, lng: 30.2833, radius: 30 },
];

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Convert coordinates to general area name (local, no external API)
 * @param {number} latitude
 * @param {number} longitude
 * @returns {object} { area: string, country: string, distance: number }
 */
function reverseGeocodeLocal(latitude, longitude) {
    let closestCity = null;
    let minDistance = Infinity;

    // Find closest Egyptian city
    for (const city of EGYPT_CITIES) {
        const distance = calculateDistance(latitude, longitude, city.lat, city.lng);
        if (distance < minDistance && distance <= city.radius * 2) {
            minDistance = distance;
            closestCity = city;
        }
    }

    if (closestCity) {
        return {
            area: closestCity.name,
            country: 'مصر',
            distance: Math.round(minDistance),
            type: 'city'
        };
    }

    // Fallback: Determine region based on general coordinates
    // Egypt boundaries: lat 22-32, lng 25-35
    const region = determineRegion(latitude, longitude);
    return {
        area: region.name,
        country: 'مصر',
        distance: null,
        type: 'region'
    };
}

/**
 * Determine general region based on coordinates
 */
function determineRegion(lat, lng) {
    // Northern Egypt
    if (lat > 31) {
        return { name: 'شمال مصر' };
    }
    // Middle Egypt
    if (lat > 28) {
        return { name: 'وسط مصر' };
    }
    // Upper Egypt
    if (lat > 25) {
        return { name: 'جنوب مصر (الصعيد)' };
    }
    // Sinai
    if (lng > 33) {
        return { name: 'شبه جزيرة سيناء' };
    }
    // Western Desert
    if (lng < 28) {
        return { name: 'الصحراء الغربية' };
    }
    return { name: 'مصر' };
}

/**
 * Format location for display
 * @param {object} location - { latitude, longitude, accuracy }
 * @returns {string} Formatted location string
 */
function formatLocation(location) {
    if (!location) return 'غير محدد';

    const geoData = reverseGeocodeLocal(location.latitude, location.longitude);
    
    let result = geoData.area;
    if (geoData.country) {
        result += `، ${geoData.country}`;
    }
    if (location.accuracy) {
        result += ` (دقة: ±${Math.round(location.accuracy)}م)`;
    }
    
    return result;
}

module.exports = {
    reverseGeocodeLocal,
    formatLocation,
    EGYPT_CITIES
};