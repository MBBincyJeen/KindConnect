(function() {
  // Verhoeff multiplication table
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
  ];

  // Verhoeff permutation table
  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
  ];

  function verhoeffValidate(num) {
    let c = 0;
    const numStr = num.toString().split("").reverse();
    for (let i = 0; i < numStr.length; i++) {
      c = d[c][p[i % 8][parseInt(numStr[i], 10)]];
    }
    return c === 0;
  }

  window.validateAadhaar = function(aadhaarNumber) {
    // Strip spaces
    const cleanNum = (aadhaarNumber || "").replace(/\s+/g, "");
    
    // Must be exactly 12 digits
    if (!/^\d{12}$/.test(cleanNum)) {
      return false;
    }
    
    // First digit cannot be 0 or 1
    if (cleanNum[0] === '0' || cleanNum[0] === '1') {
      return false;
    }
    
    // Basic checks: cannot be all identical digits
    if (/^(\d)\1{11}$/.test(cleanNum)) {
      return false;
    }
    
    return verhoeffValidate(cleanNum);
  };

  window.setupAadhaarValidation = function(inputId, statusId) {
    const input = document.getElementById(inputId);
    const status = document.getElementById(statusId);
    if (!input || !status) return;

    input.addEventListener("input", function(e) {
      let value = e.target.value.replace(/\D/g, "");
      
      // Limit to 12 digits
      if (value.length > 12) {
        value = value.substr(0, 12);
      }
      
      // Format as XXXX XXXX XXXX
      let formatted = "";
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) {
          formatted += " ";
        }
        formatted += value[i];
      }
      e.target.value = formatted;

      // Validate
      if (value.length === 0) {
        status.innerHTML = "";
        status.className = "aadhaar-status";
        input.classList.remove("valid-border", "invalid-border");
      } else if (value.length < 12) {
        status.innerHTML = "✗ Must be 12 digits";
        status.className = "aadhaar-status invalid";
        input.classList.add("invalid-border");
        input.classList.remove("valid-border");
      } else {
        const isValid = window.validateAadhaar(value);
        if (isValid) {
          status.innerHTML = "✓ Valid Aadhaar Format";
          status.className = "aadhaar-status valid";
          input.classList.add("valid-border");
          input.classList.remove("invalid-border");
        } else {
          status.innerHTML = "✗ Invalid Aadhaar (Checksum failed)";
          status.className = "aadhaar-status invalid";
          input.classList.add("invalid-border");
          input.classList.remove("valid-border");
        }
      }
    });
  };
})();
