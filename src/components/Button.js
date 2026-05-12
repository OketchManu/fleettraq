import React from "react";
import { motion } from "framer-motion";

const Button = ({ 
  onClick, 
  children, 
  disabled = false, 
  variant = "primary",
  className = "",
  type = "button",
  size = "md"
}) => {
  const variants = {
    primary: "bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-lg hover:shadow-yellow-500/25",
    secondary: "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:shadow-gray-500/25",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg hover:shadow-red-500/25",
    success: "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-green-500/25",
    outline: "border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={!disabled ? { scale: 1.03 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      disabled={disabled}
      className={`rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 ${variants[variant]} ${sizes[size]} ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export default Button;