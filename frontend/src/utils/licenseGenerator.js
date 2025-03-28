export const generateLicenseKey = (seed = Date.now()) => {
    // Characters allowed in the license key (uppercase letters and numbers)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    // Create a more reliable seeded random function
    const random = () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
    
    // Generate each segment of the license key
    const generateSegment = (length) => {
        let segment = '';
        for (let i = 0; i < length; i++) {
            segment += chars.charAt(Math.floor(random() * chars.length));
        }
        return segment;
    };
    
    // Format: 8-4-4-4-12 characters (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)
    return [
        generateSegment(8),  // 8 characters
        generateSegment(4),  // 4 characters
        generateSegment(4),  // 4 characters
        generateSegment(4),  // 4 characters
        generateSegment(12)  // 12 characters
    ].join('-');
};