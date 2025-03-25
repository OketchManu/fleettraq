import React from "react";

export const Select = ({ options = [], onChange }) => {
  return (
    <select onChange={onChange}>
      {options.length > 0 ? (
        options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))
      ) : (
        <option disabled>No options available</option>
      )}
    </select>
  );
};

// Extra elements (if your project expects them)
export const SelectTrigger = ({ children }) => (
  <div className="select-trigger">{children}</div>
);
export const SelectValue = ({ children }) => (
  <div className="select-value">{children}</div>
);
export const SelectContent = ({ children }) => (
  <div className="select-content">{children}</div>
);
export const SelectItem = ({ value, children }) => (
  <div className="select-item" data-value={value}>
    {children}
  </div>
);
