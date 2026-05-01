// src/services/whatsappSharing.js

// WhatsApp sharing service
export const whatsappSharing = {
  // Base URL for WhatsApp sharing
  WHATSAPP_BASE_URL: 'https://wa.me/',
  
  // VitaChain app URL (would be configured based on deployment)
  APP_URL: window.location.origin || 'https://vitachain.app',
  
  /**
   * Share a health summary via WhatsApp
   * @param {string} phoneNumber - The phone number to share with (include country code)
   * @param {string} summaryText - The health summary text to share
   * @returns {void} - Opens WhatsApp in a new tab/window
   */
  shareHealthSummary: (phoneNumber, summaryText) => {
    const message = encodeURIComponent(
      `Hello! I wanted to share my health summary from VitaChain:\n\n${summaryText}\n\nLearn more about VitaChain: ${whatsappSharing.APP_URL}`
    );
    const url = `${whatsappSharing.WHATSAPP_BASE_URL}${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
  },
  
  /**
   * Share a passport QR code via WhatsApp
   * @param {string} phoneNumber - The phone number to share with (include country code)
   * @param {string} qrImageBase64 - Base64 encoded QR code image
   * @returns {void} - Opens WhatsApp in a new tab/window
   */
  sharePassportQR: (phoneNumber, qrImageBase64) => {
    // Note: WhatsApp web/webapp doesn't support sending images via URL parameters directly
    // In a real implementation, we would need to use the WhatsApp Business API or 
    // have the user manually share the image after opening the chat
    const message = encodeURIComponent(
      `I've shared my VitaChain health passport with you! You can scan the QR code to view my health summary.\n\nLearn more about VitaChain: ${whatsappSharing.APP_URL}`
    );
    const url = `${whatsappSharing.WHATSAPP_BASE_URL}${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
    // In a real app, we would also provide instructions to attach the QR image
  },
  
  /**
   * Share an achievement/badge via WhatsApp
   * @param {string} phoneNumber - The phone number to share with (include country code)
   * @param {string} badgeName - The name of the badge earned
   * @param {string} badgeDescription - Description of what the badge represents
   * @returns {void} - Opens WhatsApp in a new tab/window
   */
  shareAchievement: (phoneNumber, badgeName, badgeDescription) => {
    const message = encodeURIComponent(
      `I just earned the "${badgeName}" badge in VitaChain! ${badgeDescription}\n\nCheck out VitaChain: ${whatsappSharing.APP_URL}`
    );
    const url = `${whatsappSharing.WHATSAPP_BASE_URL}${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
  },
  
  /**
   * Share a referral link via WhatsApp
   * @param {string} phoneNumber - The phone number to share with (include country code)
   * @param {string} referralCode - The referral code to share
   * @returns {void} - Opens WhatsApp in a new tab/window
   */
  shareReferralLink: (phoneNumber, referralCode) => {
    const referralUrl = `${whatsappSharing.APP_URL}/referral?code=${referralCode}`;
    const message = encodeURIComponent(
      `I've been using VitaChain to manage my health, and I think you would like it too! Join using my referral code: ${referralCode}\n\nSign up here: ${referralUrl}`
    );
    const url = `${whatsappSharing.WHATSAPP_BASE_URL}${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
  },
  
  /**
   * Invite a family member to view your health data (with appropriate permissions)
   * @param {string} phoneNumber - The phone number to share with (include country code)
   * @param {string} relationship - The relationship (e.g., "mother", "father", "doctor")
   * @returns {void} - Opens WhatsApp in a new tab/window
   */
  inviteFamilyMember: (phoneNumber, relationship) => {
    const message = encodeURIComponent(
      `I've invited you to view my health summary on VitaChain as my ${relationship}. Please join to stay updated on my health journey.\n\nLearn more about VitaChain: ${whatsappSharing.APP_URL}`
    );
    const url = `${whatsappSharing.WHATSAPP_BASE_URL}${phoneNumber}?text=${message}`;
    window.open(url, '_blank');
  }
};

export default whatsappSharing;