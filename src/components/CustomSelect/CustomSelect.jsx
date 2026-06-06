import { useEffect, useRef, useState } from "react";
import "./CustomSelect.css";

function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(optionValue) {
    onChange(optionValue);
    setOpen(false);
  }

  return (
    <div className={`custom-select ${className}`} ref={selectRef}>
      <button
        type="button"
        className={`custom-select__button ${open ? "active" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="custom-select__arrow">▾</span>
      </button>

      {open && (
        <div className="custom-select__menu">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`custom-select__option ${
                option.value === value ? "selected" : ""
              }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;