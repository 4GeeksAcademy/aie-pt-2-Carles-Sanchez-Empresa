document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("application-form");
  const empresa = document.getElementById("empresa");
  const contacto = document.getElementById("contacto");
  const email = document.getElementById("email");
  const telefono = document.getElementById("telefono");
  const web = document.getElementById("web");
  const pais = document.getElementById("pais");
  const producto = document.getElementById("producto");
  const volumen = document.getElementById("volumen");
  const serviciosCheckboxes = Array.from(form.querySelectorAll('input[name="servicios[]"]'));
  const comentarios = document.getElementById("comentarios");
  const politicaCheckbox = form.querySelector('input[name="politica_privacidad"]');
  const otro3plRadios = Array.from(form.querySelectorAll('input[name="otro_3pl"]'));

  const errors = {
    empresa: document.getElementById("empresa-error"),
    contacto: document.getElementById("contacto-error"),
    email: document.getElementById("email-error"),
    telefono: document.getElementById("telefono-error"),
    web: document.getElementById("web-error"),
    pais: document.getElementById("pais-error"),
    producto: document.getElementById("producto-error"),
    volumen: document.getElementById("volumen-error"),
    servicios: document.getElementById("servicios-error"),
    comentarios: document.getElementById("comentarios-error"),
    politica: document.getElementById("politica-error"),
    otro3pl: document.getElementById("otro-3pl-error"),
  };

  const warningMessage = document.getElementById("producto-volumen-warning");
  const comentariosCount = document.getElementById("comentarios-count");
  const successMessage = document.getElementById("success-message");
  const clearButton = document.getElementById("clear-form");

  function setInvalidField(target, invalid) {
    if (!target) return;
    target.classList.toggle("border-red-600", invalid);
    target.classList.toggle("bg-[#fee2e2]", invalid);
    target.classList.toggle("ring-2", invalid);
    target.classList.toggle("ring-red-500/40", invalid);
  }

  function showError(element, message, show = true, invalidTarget = null) {
    if (!element) return false;
    element.textContent = show ? message : "";
    element.hidden = !show;
    element.classList.toggle("hidden", !show);

    if (invalidTarget) {
      setInvalidField(invalidTarget, show);
    }
    return show;
  }

  function validateEmpresa() {
    const value = empresa.value.trim();
    const valid = value.length >= 2;
    showError(errors.empresa, "El nombre de la empresa debe tener al menos 2 caracteres.", !valid, empresa);
    return valid;
  }

  function validateContacto() {
    const value = contacto.value.trim();
    const parts = value.split(/\s+/).filter(Boolean);
    const valid = parts.length >= 2;
    showError(errors.contacto, "Ingresa nombre y apellido del contacto.", !valid, contacto);
    return valid;
  }

  function validateEmail() {
    const value = email.value.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    showError(errors.email, "Ingresa un email corporativo válido (ejemplo: nombre@empresa.com).", !valid, email);
    return valid;
  }

  function validateTelefono() {
    const value = telefono.value.trim();
    const valid = /^\+\d[\d\s()-]*$/.test(value);
    showError(errors.telefono, "El teléfono debe incluir código de país (ejemplo: +1 213 555 0147).", !valid, telefono);
    return valid;
  }

  function validateWeb() {
    const value = web.value.trim();

    if (value === "") {
      showError(errors.web, "Ingresa el sitio web de la empresa en formato válido (https://www.empresa.com).", true, web);
      return false;
    }

    const validUrl = /^(https?:\/\/).+/.test(value);
    if (!validUrl) {
      showError(errors.web, "Ingresa el sitio web de la empresa en formato válido (https://www.empresa.com).", true, web);
      return false;
    }

    showError(errors.web, "", false, web);
    return true;
  }

  function validatePais() {
    const valid = pais.value.trim() !== "";
    showError(errors.pais, "Selecciona el país de operación principal.", !valid, pais);
    return valid;
  }

  function validateProducto() {
    const valid = producto.value.trim() !== "";
    showError(errors.producto, "Selecciona el tipo de producto que manejas.", !valid, producto);
    return valid;
  }

  function validateVolumen() {
    const valid = volumen.value.trim() !== "";
    showError(errors.volumen, "Selecciona el volumen mensual estimado.", !valid, volumen);
    return valid;
  }

  function validateProductVolumeRestriction() {
    const productValue = producto.value.trim();
    const volumeValue = volumen.value.trim();
    const isOtherProduct = ["otro", "otros"].includes(productValue.toLowerCase());
    const shouldWarn = productValue !== "" && !isOtherProduct && volumeValue === "0-100";

    if (shouldWarn) {
      warningMessage.textContent = "Para volúmenes menores a 100 envíos mensuales, nuestros servicios podrían no ser la solución más eficiente. ¿Seguro que quieres continuar?";
      warningMessage.classList.remove("hidden");
    } else {
      warningMessage.textContent = "";
      warningMessage.classList.add("hidden");
    }

    return shouldWarn;
  }

  const serviciosGroup = document.getElementById("servicios-group");
  const politicaGroup = document.getElementById("politica-group");
  const otro3plGroup = document.getElementById("otro-3pl-group");

  function validateServicios() {
    const selected = serviciosCheckboxes.some((checkbox) => checkbox.checked);
    showError(errors.servicios, "Selecciona al menos un servicio de interés.", !selected, serviciosGroup);
    return selected;
  }

  function validateComentarios() {
    const length = comentarios.value.length;
    const remaining = 500 - length;
    comentariosCount.textContent = `${remaining} caracteres restantes`;
    const valid = length <= 500;
    showError(errors.comentarios, `Los comentarios no pueden exceder 500 caracteres (quedan ${Math.max(0, remaining)}).`, !valid, comentarios);
    return valid;
  }

  function validatePolitica() {
    const accepted = politicaCheckbox.checked;
    showError(errors.politica, "Debes aceptar la política de privacidad para continuar.", !accepted, politicaGroup);
    return accepted;
  }

  function validateOtro3pl() {
    const selected = otro3plRadios.some((radio) => radio.checked);
    showError(errors.otro3pl, "Indica si actualmente trabajas con otro proveedor logístico.", !selected, otro3plGroup);
    return selected;
  }

  empresa.addEventListener("input", validateEmpresa);
  contacto.addEventListener("input", validateContacto);
  email.addEventListener("input", validateEmail);
  telefono.addEventListener("input", validateTelefono);
  web.addEventListener("input", validateWeb);
  web.addEventListener("blur", validateWeb);
  pais.addEventListener("change", validatePais);
  producto.addEventListener("change", () => {
    validateProducto();
    validateProductVolumeRestriction();
  });
  volumen.addEventListener("change", () => {
    validateVolumen();
    validateProductVolumeRestriction();
  });
  serviciosCheckboxes.forEach((checkbox) => checkbox.addEventListener("change", validateServicios));
  comentarios.addEventListener("input", validateComentarios);
  politicaCheckbox.addEventListener("change", validatePolitica);
  otro3plRadios.forEach((radio) => radio.addEventListener("change", validateOtro3pl));

  form.addEventListener("submit", function (event) {
    const validationResults = [
      { valid: validateEmpresa(), focusTarget: empresa },
      { valid: validateContacto(), focusTarget: contacto },
      { valid: validateEmail(), focusTarget: email },
      { valid: validateTelefono(), focusTarget: telefono },
      { valid: validateWeb(), focusTarget: web },
      { valid: validatePais(), focusTarget: pais },
      { valid: validateProducto(), focusTarget: producto },
      { valid: validateVolumen(), focusTarget: volumen },
      { valid: validateServicios(), focusTarget: serviciosCheckboxes[0] || serviciosGroup },
      { valid: validateComentarios(), focusTarget: comentarios },
      { valid: validatePolitica(), focusTarget: politicaCheckbox },
      { valid: validateOtro3pl(), focusTarget: otro3plRadios[0] || otro3plGroup },
    ];

    const firstInvalid = validationResults.find((result) => !result.valid);

    if (firstInvalid) {
      event.preventDefault();
      successMessage.classList.add("hidden");
      if (firstInvalid.focusTarget && typeof firstInvalid.focusTarget.focus === "function") {
        firstInvalid.focusTarget.focus();
      }
    } else {
      event.preventDefault();
      successMessage.classList.remove("hidden");
      window.scrollTo(0, 0);
    }
  });

  validateComentarios();
  validateProductVolumeRestriction();

  clearButton.addEventListener("click", function () {
    form.reset();
    successMessage.classList.add("hidden");
    warningMessage.classList.add("hidden");
    Object.values(errors).forEach((errorElement) => {
      if (errorElement) {
        errorElement.textContent = "";
        errorElement.hidden = true;
        errorElement.classList.add("hidden");
      }
    });
    [empresa, contacto, email, telefono, web, pais, producto, volumen, comentarios].forEach((field) => {
      setInvalidField(field, false);
    });
    [serviciosGroup, politicaGroup, otro3plGroup].forEach((group) => {
      setInvalidField(group, false);
    });
    validateComentarios();
    validateProductVolumeRestriction();
  });
});
