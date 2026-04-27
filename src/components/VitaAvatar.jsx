const STATE_MAP = {
  default: 'vita-default.png',
  success: 'vita-success.png',
  error: 'vita-error.png',
  alert: 'vita-alert.png',
  offline: 'vita-offline.png',
  loading: 'vita-loading.png',
  empty: 'vita-empty.png',
  search: 'vita-search.png',
  privacy: 'vita-privacy.png',
  health: 'vita-health.png',
  share: 'vita-share.png',
  celebrate: 'vita-celebrate.png',
};

export default function VitaAvatar({ state, size = 120, className = '' }) {
  const filename = STATE_MAP[state] || STATE_MAP.default;
  const src = `/avatars/${filename}`;

  return (
    <img
      src={src}
      alt={`Vita avatar: ${state}`}
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
      }}
      loading="lazy"
    />
  );
}
