import React from "react";
import { motion } from "framer-motion";

const Button = ({ onClick, children, disabled = false, className = "" }) => (
  <motion.button
    onClick={onClick}
    whileHover={!disabled ? { scale: 1.05 } : {}}
    whileTap={!disabled ? { scale: 0.95 } : {}}
    disabled={disabled}
    className={`px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-700 text-black rounded-md font-bold flex items-center text-sm shadow-lg border border-yellow-300 ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
  >
    {children}
  </motion.button>
);

export default Button;