import React from 'react';

const Avatar = ({ user, className = 'w-8 h-8', sizeText = 'text-xs' }) => {
  const name = user?.name || 'Anonymous';
  const avatarUrl = user?.avatarUrl;

  const isCustomImage = avatarUrl && 
    avatarUrl.startsWith('http') && 
    !avatarUrl.includes('api.dicebear.com');

  if (isCustomImage) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${className} rounded-full object-cover border border-slate-800 bg-slate-900`}
      />
    );
  }

  // Generate a consistent, aesthetic dark monochrome background based on username
  const getAvatarColors = (str) => {
    const themes = [
      { bg: 'bg-zinc-800', border: 'border-zinc-700/80', text: 'text-zinc-100' },
      { bg: 'bg-stone-800', border: 'border-stone-700/80', text: 'text-stone-100' },
      { bg: 'bg-neutral-800', border: 'border-neutral-700/80', text: 'text-neutral-100' },
      { bg: 'bg-slate-800', border: 'border-slate-700/80', text: 'text-slate-100' },
      { bg: 'bg-zinc-900', border: 'border-zinc-800/80', text: 'text-zinc-300' },
      { bg: 'bg-neutral-900', border: 'border-neutral-800/80', text: 'text-neutral-300' },
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % themes.length;
    return themes[index];
  };

  const theme = getAvatarColors(name);
  const letter = name.trim().charAt(0).toUpperCase();

  return (
    <div
      className={`${className} rounded-full flex items-center justify-center font-bold ${sizeText} ${theme.bg} ${theme.border} ${theme.text} border select-none`}
      title={name}
    >
      {letter}
    </div>
  );
};

export default Avatar;
