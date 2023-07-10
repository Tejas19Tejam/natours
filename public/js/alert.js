/**
 * @description This will hide the alert box
 */
export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

/**
 *@description This module is use to show alert popup while saving , update , error event happen
 * @param {String} type - Type is 'success' or 'error'
 * @param {String} msg  - Message to show .
 */
export const showAlert = (type, msg, time = 5) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, time * 1000);
};
