function escapeName(value) {
  if (globalThis.CSS?.escape) return CSS.escape(String(value));
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

/**
 * Return concrete form controls for a field name without relying on the
 * HTMLFormControlsCollection named property shape. A same-name field may be a
 * single element, a RadioNodeList, or multiple controls depending on markup.
 */
export function namedFormControls(form, name) {
  if (!form?.querySelectorAll) return [];
  return Array.from(form.querySelectorAll(`[name="${escapeName(name)}"]`));
}

export function namedFormValue(form, name, fallback = "") {
  const controls = namedFormControls(form, name);
  if (!controls.length) return fallback;
  const checkable = controls.filter((control) => control?.type === "radio" || control?.type === "checkbox");
  if (checkable.length) {
    const checked = checkable.find((control) => control.checked);
    return checked?.value ?? fallback;
  }
  return controls[0]?.value ?? fallback;
}

export function namedFormChecked(form, name, fallback = false) {
  const controls = namedFormControls(form, name);
  if (!controls.length) return fallback;
  return controls.some((control) => Boolean(control.checked));
}

export function bindNamedControls(form, name, eventName, listener, { signal } = {}) {
  const controls = namedFormControls(form, name);
  for (const control of controls) {
    if (typeof control?.addEventListener !== "function") continue;
    control.addEventListener(eventName, listener, signal ? { signal } : undefined);
  }
  return controls.length;
}

export function bindOptionalControl(root, selector, eventName, listener, { signal } = {}) {
  const control = root?.querySelector?.(selector);
  if (!control || typeof control.addEventListener !== "function") return false;
  control.addEventListener(eventName, listener, signal ? { signal } : undefined);
  return true;
}
