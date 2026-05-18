import React from 'react';
import { Truck } from 'lucide-react';

const ProfilePicture = ({ size = 40, userId, name, email, className = "" }) => {
  // Generate consistent color based on userId
  const getColorFromId = (id) => {
    if (!id) return { bg: "from-yellow-500 to-amber-600", text: "text-black" };
    const colors = [
      { bg: "from-red-500 to-red-600", text: "text-white" },
      { bg: "from-blue-500 to-blue-600", text: "text-white" },
      { bg: "from-green-500 to-green-600", text: "text-white" },
      { bg: "from-purple-500 to-purple-600", text: "text-white" },
      { bg: "from-pink-500 to-pink-600", text: "text-white" },
      { bg: "from-indigo-500 to-indigo-600", text: "text-white" },
      { bg: "from-cyan-500 to-cyan-600", text: "text-white" },
      { bg: "from-orange-500 to-orange-600", text: "text-white" },
    ];
    const index = id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const colorStyle = getColorFromId(userId);
  const initials = name 
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email ? email[0].toUpperCase() : 'U';

  return (
    <div 
      className={`rounded-full bg-gradient-to-r ${colorStyle.bg} flex items-center justify-center shadow-lg ${className}`}
      style={{ width: size, height: size }}
    >
      {initials === 'U' ? (
        <Truck size={size * 0.5} className={colorStyle.text} />
      ) : (
        <span className={`font-bold ${colorStyle.text}`} style={{ fontSize: size * 0.4 }}>
          {initials}
        </span>
      )}
    </div>
  );
};

export default ProfilePicture;