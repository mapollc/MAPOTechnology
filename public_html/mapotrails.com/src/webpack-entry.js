// ADDED: CSS imports are only included when building with Webpack.
import './css/main.css';
import './css/app.css';
import './css/supp.css';

// ADDED: Load the actual application after the production CSS.
import './main.js';