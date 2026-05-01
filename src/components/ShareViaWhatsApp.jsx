import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import whatsappSharing from '../services/whatsappSharing';

export function ShareViaWhatsApp({ 
  type, 
  phoneNumber, 
  summaryText, 
  qrImageBase64, 
  badgeName, 
  badgeDescription, 
  referralCode, 
  relationship 
}) {
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!phoneNumber) {
      alert('Phone number is required');
      return;
    }

    setLoading(true);
    try {
      switch (type) {
        case 'healthSummary':
          if (!summaryText) throw new Error('Health summary text is required');
          whatsappSharing.shareHealthSummary(phoneNumber, summaryText);
          break;
        case 'passportQR':
          if (!qrImageBase64) throw new Error('QR image base64 is required');
          whatsappSharing.sharePassportQR(phoneNumber, qrImageBase64);
          break;
        case 'achievement':
          if (!badgeName) throw new Error('Badge name is required');
          whatsappSharing.shareAchievement(phoneNumber, badgeName, badgeDescription || '');
          break;
        case 'referralLink':
          if (!referralCode) throw new Error('Referral code is required');
          whatsappSharing.shareReferralLink(phoneNumber, referralCode);
          break;
        case 'familyInvite':
          if (!relationship) throw new Error('Relationship is required');
          whatsappSharing.inviteFamilyMember(phoneNumber, relationship);
          break;
        default:
          throw new Error(`Invalid share type: ${type}`);
      }
    } catch (error) {
      console.error('Failed to share via WhatsApp:', error);
      alert(error.message || 'Failed to share via WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleShare}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-full 
        bg-green-500 text-white hover:bg-green-600 transition-colors duration-200
        flex-shrink-0"
      style={{
        // WhatsApp green color as inline style to ensure correctness
        backgroundColor: '#25D366',
        color: '#fff',
        '&:hover': {
          backgroundColor: '#20b548'
        }
      }}
    >
      <MessageCircle size={20} className="flex-shrink-0" />
      <span className="text-sm font-medium">Share via WhatsApp</span>
      {loading && (
        <span className="ml-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin flex-shrink-0" />
      )}
    </motion.button>
  );
}