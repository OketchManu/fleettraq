import React from "react";
import ProfilePicture from "./ProfilePicture";

const DriverAvatar = ({ driver, size = 56, className = "" }) => {
  const name = driver?.name || "";
  const email = driver?.email || "";

  if (driver?.photoUrl) {
    return (
      <img
        src={driver.photoUrl}
        alt={name || "Driver"}
        className={`rounded-full object-cover border-2 border-yellow-500/40 shadow-lg ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <ProfilePicture
      userId={driver?.id || driver?.authUid || email}
      name={name}
      email={email}
      size={size}
      className={className}
    />
  );
};

export default DriverAvatar;
