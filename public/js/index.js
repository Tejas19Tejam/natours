/** This file is use to get data from user interface , and delegate it to the modules(e.g map , login etc )  */
import '@babel/polyfill';
import { login, logout } from './login.js';
import { getCallBack } from './map.js';
import { updateSettings } from './updateSettings.js';
import { bookTour } from './stripe.js';
// PROTECTOR
/**
 *
 * @param  {Array} data - Parameter need to trim
 * @returns Array of parameter , remove white spaces
 */
const removeWhiteSpace = (...data) => {
  const arr = data.map((elm) => {
    if (typeof elm === 'string') {
      return elm.replace(/\s+/g, ' ');
    }
    return elm;
  });

  return arr;
};

// DOM ELEMENTS
const mapBox = document.querySelector('#map');
const formLogin = document.querySelector('.form--login');
const formUserData = document.querySelector('.form-user-data');
const logOutBtn = document.querySelector('.nav__el--logout');
const formUserPwd = document.querySelector('.form-user-settings');
const bookTourBtn = document.querySelector('#book-tour');

// DELEGATION
if (mapBox) {
  // Get location to render a map
  const locations = JSON.parse(mapBox.dataset.locations);
  getCallBack(locations);
}

if (formLogin) {
  // Login Event
  formLogin.addEventListener('submit', (e) => {
    e.preventDefault();
    let email = document.getElementById('email').value;
    let password = document.getElementById('password').value;
    [email, password] = [...removeWhiteSpace(email, password)];
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', () => {
    logout();
  });
}

if (formUserData) {
  formUserData.addEventListener('submit', (e) => {
    e.preventDefault();

    // REMOVE WHITESPACE
    const [name, email] = [
      ...removeWhiteSpace(
        document.getElementById('name').value,
        document.getElementById('email').value
      ),
    ];

    // Create Form Programmatically
    // create a new FormData object programmatically in JavaScript to simulate the behavior of an HTML form .
    // Note : that the Content-Type header will automatically be set to multipart/form-data when sending FormData objects, which is the appropriate content type for sending files and other binary data.
    const form = new FormData();

    form.append('name', name);
    form.append('email', email);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);
    updateSettings(form, 'data');
  });
}

if (formUserPwd) {
  formUserPwd.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Changing status of Save button
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    // Get element
    let currentPassword = document.getElementById('password-current').value;
    let password = document.getElementById('password').value;
    let confirmedPassword = document.getElementById('password-confirm').value;

    // REMOVE WHITE SPACE
    [currentPassword, password, confirmedPassword] = [
      ...removeWhiteSpace(currentPassword, password, confirmedPassword),
    ];

    // The await keyword is used inside an async function to wait for the result of an asynchronous operation. When an async function encounters an await keyword, it suspends its execution and allows other code to run.

    await updateSettings(
      { currentPassword, password, confirmedPassword },
      'password'
    );

    // Resetting values to NULL
    currentPassword = document.getElementById('password-current').value = '';
    password = document.getElementById('password').value = '';
    confirmedPassword = document.getElementById('password-confirm').value = '';

    document.querySelector('.btn--save-password').textContent = 'Save password';
  });
}

if (bookTourBtn) {
  bookTourBtn.addEventListener('click', (e) => {
    e.preventDefault();
    bookTourBtn.textContent = 'Processing...';
    bookTour(bookTourBtn.dataset.tourId);
  });
}
