/**
 * The eight Mos Urban components as shipped, rebuilt as static HTML (#172): Mos's own class names from the
 * Webflow site, real staging content (13 Nov 2026), each wrapped in the playground's selection label.
 * Rebuilt from the staging stylesheet and the embeds in the Mos repo (reference/custom-code); the behaviour
 * is in kit.js and the styles in kit.css, all scoped under `.mos`. Photos are served from /mos-playground/.
 * Server-rendered as is, so every component reads correctly before (or without) JavaScript.
 */
export const KIT_MARKUP = String.raw`
<figure class="mpg-item" data-c="menu"><figcaption class="mpg-tag">Menu</figcaption><div class="mpg-sel">
<div class="mos mos-c" data-c="menu" data-name="Menu">
  <div class="m-viewport">
    <div class="overlay_background" aria-hidden="true"></div>
    <nav class="navbar_menu color-scheme-4" aria-label="Main">
      <div class="navbar_menu-wrapper">
        <div class="navbar_links-wrapper">
          <a href="#" class="navbar_link"><span class="navbar_link-label">Products</span></a>
          <a href="#" class="navbar_link"><span class="navbar_link-label">Projects</span></a>
          <a href="#" class="navbar_link"><span class="navbar_link-label">About</span></a>
          <a href="#" class="navbar_link"><span class="navbar_link-label">Sustainability</span></a>
          <a href="#" class="navbar_link"><span class="navbar_link-label">Contact</span></a>
        </div>
        <div class="navbar_menu-bottom">
          <div class="text-size-tiny">Follow Us</div>
          <div class="navbar_social-list">
            <a href="#" class="navbar_social-link" aria-label="Mos Urban on Instagram">Instagram</a>
            <a href="#" class="navbar_social-link" aria-label="Mos Urban on LinkedIn">LinkedIn</a>
          </div>
        </div>
      </div>
    </nav>
    <div class="navbar_component">
      <div class="navbar_container">
        <a href="#" class="navbar_logo-link" aria-label="Mos Urban home"><svg class="logo_icon-icon" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" preserveAspectRatio="xMidYMid meet" viewBox="0 0 154 64" fill="currentColor"><path d="M59.5939 0.0068832L34.38 51.5483L8.91919 0L0 62.4926L5.43384 63.2704L11.8488 18.33L34.4075 64L56.6917 18.4401L63.1204 63.2772L68.5542 62.4926L59.5939 0.0068832Z"/><path d="M93.7267 13.491C79.8265 13.491 68.5541 24.8001 68.5541 38.7455C68.5541 52.6908 79.8265 63.9999 93.7267 63.9999C107.627 63.9999 118.899 52.6908 118.899 38.7455C118.899 24.8001 107.627 13.491 93.7267 13.491ZM93.7267 58.4934C82.8522 58.4934 74.0359 49.6485 74.0359 38.7386C74.0359 27.8287 82.8522 18.9838 93.7267 18.9838C104.601 18.9838 113.418 27.8287 113.418 38.7386C113.418 49.6485 104.601 58.4934 93.7267 58.4934Z"/><path d="M145.115 42.3179C143.475 40.1084 140.353 37.8163 135.763 35.4279C131.921 33.4868 129.39 31.7866 128.182 30.3274C127.036 28.9439 126.453 27.4915 126.453 25.9703C126.453 24.0637 127.222 22.398 128.765 20.9732C130.192 19.6516 131.901 18.9839 133.904 18.9839C137.046 18.9839 140.264 20.5877 143.557 23.7884L147.379 19.8374C146.432 18.9151 145.403 18.0271 144.36 17.2493C143.31 16.4715 142.24 15.8039 141.122 15.2463C140.003 14.6888 138.83 14.2414 137.616 13.9385C136.401 13.6357 135.153 13.4705 133.911 13.4705C132.299 13.4705 130.673 13.7458 129.156 14.3378C127.64 14.9228 126.24 15.8245 125.054 16.9189C123.825 18.0616 122.783 19.4175 122.069 20.9663C121.355 22.515 120.985 24.2564 120.985 25.9566C120.985 27.4021 121.28 28.8888 121.808 30.2242C122.337 31.5595 123.084 32.7572 123.983 33.8378C124.532 34.4986 125.156 35.0975 125.815 35.6619C126.474 36.2194 127.174 36.7357 127.935 37.2519C128.697 37.7613 129.52 38.2706 130.405 38.78C130.851 39.0347 131.304 39.2893 131.791 39.544C132.271 39.8056 132.779 40.0671 133.28 40.3218C133.781 40.5834 134.288 40.8587 134.762 41.1203C135.235 41.3887 135.674 41.6434 136.093 41.8981C136.923 42.4005 137.657 42.8961 138.281 43.3504C138.906 43.8047 139.413 44.2315 139.825 44.6169C140.031 44.8097 140.209 44.9886 140.346 45.1469C140.491 45.2984 140.593 45.4291 140.71 45.5806C140.937 45.8972 141.149 46.2414 141.321 46.5786C141.492 46.9159 141.623 47.2463 141.732 47.5836C141.842 47.9209 141.925 48.2719 141.979 48.6574C142.034 49.0428 142.069 49.4627 142.069 49.8619C142.069 50.1785 142.055 50.5089 142.027 50.8118C142 51.1215 141.959 51.4038 141.904 51.6791C141.801 52.2297 141.65 52.7391 141.451 53.2209C141.252 53.7027 141.005 54.1639 140.696 54.6182C140.545 54.8454 140.374 55.0656 140.182 55.2996C139.99 55.5268 139.777 55.7608 139.557 55.9742C139.345 56.1876 139.112 56.3941 138.885 56.5799C138.659 56.7658 138.425 56.9378 138.199 57.0893C137.732 57.399 137.252 57.6468 136.738 57.8533C136.223 58.0598 135.667 58.2181 135.064 58.3282C134.762 58.3833 134.446 58.4246 134.11 58.4521C133.774 58.4797 133.41 58.4934 133.06 58.4934C128.978 58.4934 125.143 56.5455 122.721 53.2484L118.899 57.1994C120.546 59.3194 122.625 60.9852 125.143 62.1897C127.661 63.3943 130.295 64 133.06 64C137.204 64 140.655 62.6302 143.42 59.8907C146.185 57.1512 147.564 53.8129 147.564 49.8619C147.564 47.0673 146.755 44.5481 145.135 42.3111L145.115 42.3179Z"/><path d="M150.782 14.6909C149.005 14.6909 147.564 16.1354 147.564 17.9168C147.564 19.6982 149.005 21.1426 150.782 21.1426C152.559 21.1426 154 19.6982 154 17.9168C154 16.1354 152.559 14.6909 150.782 14.6909ZM150.782 20.5953C149.307 20.5953 148.11 19.3957 148.11 17.9168C148.11 16.4378 149.307 15.2382 150.782 15.2382C152.257 15.2382 153.454 16.4378 153.454 17.9168C153.454 19.3957 152.257 20.5953 150.782 20.5953ZM151.411 18.1853C151.661 18.0932 151.974 17.8325 151.974 17.327C151.974 16.8144 151.647 16.3831 150.938 16.3831H149.82C149.788 16.3831 149.762 16.409 149.762 16.4407V19.3929C149.762 19.4245 149.788 19.4505 149.82 19.4505H150.211C150.243 19.4505 150.269 19.4245 150.269 19.3929V18.271H150.906L151.441 19.4173C151.451 19.4375 151.471 19.4505 151.493 19.4505H151.939C151.948 19.4506 151.958 19.4481 151.966 19.4434C151.975 19.4387 151.982 19.4318 151.987 19.4235C151.992 19.4151 151.995 19.4056 151.996 19.3959C151.996 19.3861 151.994 19.3764 151.99 19.3677L151.411 18.1853ZM150.854 17.8664H150.269V16.8007H150.868C151.212 16.8007 151.449 16.9829 151.449 17.3443C151.449 17.682 151.235 17.8664 150.854 17.8664Z"/></svg></a>
        <button type="button" class="navbar_menu-button" aria-expanded="false" aria-label="Menu">
          <span class="navbar_menu-label" aria-hidden="true"><span class="navbar_menu-label-text">Menu</span><span class="navbar_menu-label-text">Close</span></span>
          <span class="menu-icon" aria-hidden="true"><span class="menu-icon_line-v"></span><span class="menu-icon_line-h"></span></span>
        </button>
      </div>
    </div>
  </div>
</div>
</div></figure>
<figure class="mpg-item" data-c="button"><figcaption class="mpg-tag">Arrow button</figcaption><div class="mpg-sel">
<div class="mos mos-c" data-c="button" data-name="Arrow button">
  <div class="m-btnset">
    <div class="m-ground">
      <a href="#" class="link_button"><span class="link_button-icon"><span class="link_button-icon-bg"></span><span class="link_button-icon-arrow"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"/></svg></span></span><span class="text-style-allcaps">Our story</span></a>
    </div>
    <div class="m-ground">
      <a href="#" class="link_button is-full"><span class="link_button-icon"><span class="link_button-icon-bg is-outline is-bar"></span><span class="link_button-icon-arrow is-outline"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"/></svg></span></span><span class="text-style-allcaps">Enquire</span></a>
    </div>
    <div class="m-ground is-photo color-scheme-4">
      <img class="m-ground-img" src="/mos-playground/hero-2-l.jpg" alt="" loading="lazy">
      <span class="home-hero_overlay" aria-hidden="true"></span>
      <a href="#" class="link_button"><span class="link_button-icon"><span class="link_button-icon-bg is-secondary"></span><span class="link_button-icon-arrow is-secondary"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"/></svg></span></span><span class="text-style-allcaps">See Case Study</span></a>
    </div>
    <div class="m-ground color-scheme-4">
      <a href="#" class="link_button is-inverse"><span class="link_button-icon"><span class="link_button-icon-bg is-secondary"></span><span class="link_button-icon-arrow is-secondary"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"/></svg></span></span><span class="text-style-allcaps">Go home</span></a>
    </div>
  </div>
</div>
</div></figure>
<figure class="mpg-item" data-c="downloads"><figcaption class="mpg-tag">Download tile</figcaption><div class="mpg-sel">
<div class="mos mos-c" data-c="downloads" data-name="Download tile">
  <div class="section_product-downloads color-scheme-2">
    <div class="product-downloads_grid">
      <a href="#" class="product-downloads_button">
        <span class="product-downloads_icon-wrapper"><svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#000"/><rect x="47.5" y="29.25" width="43.25" height="43.25" fill="none" stroke="#fff" stroke-width="3"/><rect x="29.25" y="47.5" width="43.25" height="43.25" fill="none" stroke="#fff" stroke-width="3"/></svg></span>
        <span class="product-downloads_text"><span class="product-downloads_label">Product Sheet</span><span class="text-style-muted">Download</span></span>
      </a>
      <a href="#" class="product-downloads_button">
        <span class="product-downloads_icon-wrapper"><svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="1.25 0 120 120"><circle cx="61.25" cy="60" r="60" fill="#000"/><path fill="#fff" fill-rule="evenodd" d="M29.19 47.19 L28.31 47.15 L27.69 46.99 L27.44 46.78 L27.28 46.31 L27.33 45.19 L27.30 33.81 L27.38 32.94 L28.14 30.31 L28.34 29.94 L29.43 28.56 L31.01 27.19 L32.06 26.82 L32.94 26.38 L33.81 26.20 L47.06 26.14 L47.81 26.24 L48.17 26.44 L48.35 26.69 L48.43 26.94 L48.55 28.31 L48.47 28.56 L48.30 28.81 L48.06 28.99 L47.69 29.14 L34.19 29.19 L33.67 29.31 L32.94 29.77 L32.19 30.12 L31.31 31.01 L31.02 31.44 L30.69 32.49 L30.38 33.19 L30.29 33.69 L30.29 45.19 L30.35 46.31 L30.22 46.69 L30.00 46.94 L29.56 47.15 L29.19 47.19ZM94.31 47.19 L92.69 47.19 L92.44 47.14 L92.18 46.94 L92.01 46.56 L91.97 46.06 L92.01 45.19 L91.97 32.81 L91.88 32.31 L91.72 31.94 L90.56 30.47 L90.06 30.05 L89.08 29.44 L88.69 29.27 L88.19 29.19 L74.44 29.15 L74.19 29.00 L74.04 28.81 L73.89 28.19 L74.00 26.81 L74.08 26.56 L74.25 26.31 L74.46 26.19 L74.81 26.11 L75.69 26.19 L88.81 26.19 L89.44 26.37 L90.19 26.83 L91.30 27.19 L91.94 27.72 L92.56 28.08 L92.81 28.29 L93.19 28.84 L93.79 29.44 L94.26 30.69 L94.73 31.44 L94.87 31.94 L94.98 33.06 L95.03 46.19 L94.99 46.56 L94.82 46.94 L94.56 47.14 L94.31 47.19ZM47.81 83.95 L47.44 84.00 L38.56 84.00 L38.06 83.88 L37.65 83.56 L37.20 82.94 L37.05 82.19 L37.08 74.81 L37.03 73.94 L37.06 73.55 L37.20 73.19 L37.56 72.91 L38.06 72.84 L39.44 72.82 L39.69 72.91 L39.88 73.06 L40.06 73.44 L40.10 73.81 L40.05 77.69 L40.18 78.06 L40.31 78.21 L40.56 78.28 L40.94 78.11 L41.78 77.19 L78.14 40.81 L79.37 39.81 L79.49 39.56 L79.44 39.31 L79.19 39.10 L78.94 39.02 L78.56 38.97 L74.56 39.00 L74.19 38.87 L73.95 38.56 L73.88 38.19 L73.93 37.56 L73.89 36.69 L74.01 36.31 L74.19 36.13 L74.56 36.00 L83.94 36.00 L84.31 36.05 L84.62 36.19 L84.85 36.44 L84.99 36.81 L85.17 38.06 L85.15 45.19 L85.21 46.06 L85.15 46.56 L85.03 46.81 L84.69 47.10 L84.19 47.19 L82.81 47.10 L82.56 47.02 L82.31 46.82 L82.19 46.56 L82.13 46.19 L82.19 45.31 L82.15 43.69 L82.23 42.81 L82.18 42.31 L82.06 42.06 L81.81 41.91 L81.44 41.93 L81.19 42.05 L80.69 42.73 L79.77 43.69 L79.19 44.16 L78.76 44.69 L78.19 45.16 L77.76 45.69 L77.19 46.16 L76.76 46.69 L76.19 47.16 L75.76 47.69 L75.19 48.16 L74.76 48.69 L74.19 49.16 L73.76 49.69 L73.19 50.16 L72.76 50.69 L72.19 51.16 L71.76 51.69 L71.19 52.16 L70.76 52.69 L70.19 53.16 L69.76 53.69 L69.19 54.16 L68.76 54.69 L68.19 55.16 L67.76 55.69 L67.19 56.16 L66.76 56.69 L66.19 57.16 L65.76 57.69 L65.19 58.16 L64.76 58.69 L64.19 59.16 L63.76 59.69 L63.19 60.16 L62.76 60.69 L62.19 61.16 L61.76 61.69 L61.19 62.16 L60.76 62.69 L60.19 63.16 L59.76 63.69 L59.19 64.16 L58.76 64.69 L58.19 65.16 L57.76 65.69 L57.19 66.16 L56.76 66.69 L56.19 67.16 L55.76 67.69 L55.19 68.16 L54.76 68.69 L54.19 69.16 L53.76 69.69 L53.19 70.16 L52.76 70.69 L52.19 71.16 L51.76 71.69 L51.19 72.16 L50.76 72.69 L50.19 73.16 L49.76 73.69 L49.19 74.16 L48.76 74.69 L48.19 75.16 L47.76 75.69 L47.19 76.16 L46.76 76.69 L46.19 77.16 L45.69 77.76 L45.16 78.19 L44.69 78.77 L43.81 79.60 L43.02 80.19 L42.92 80.44 L42.95 80.69 L43.18 80.94 L43.44 81.03 L44.69 80.98 L47.44 81.00 L47.94 81.08 L48.31 81.27 L48.46 81.44 L48.56 81.69 L48.50 82.44 L48.56 83.31 L48.36 83.69 L47.81 83.95ZM47.56 93.82 L33.69 93.80 L33.31 93.72 L32.50 93.31 L31.31 92.93 L29.94 91.90 L29.44 91.44 L28.15 89.69 L27.34 86.81 L27.33 74.81 L27.26 73.81 L27.34 73.44 L27.51 73.19 L27.81 73.00 L28.31 72.86 L29.56 72.84 L30.06 73.08 L30.24 73.31 L30.33 73.56 L30.30 86.44 L30.45 87.19 L31.06 88.65 L31.34 89.06 L32.19 89.87 L32.94 90.27 L33.44 90.66 L33.94 90.81 L47.69 90.86 L48.06 91.01 L48.31 91.20 L48.52 91.56 L48.56 91.94 L48.36 93.31 L48.19 93.55 L47.99 93.69 L47.56 93.82ZM87.81 93.81 L75.81 93.81 L74.69 93.87 L74.22 93.69 L73.99 93.31 L73.89 91.94 L73.91 91.56 L74.05 91.19 L74.19 91.02 L74.44 90.85 L74.69 90.81 L75.69 90.85 L88.19 90.83 L88.69 90.69 L89.31 90.26 L90.19 89.89 L90.56 89.63 L91.70 87.94 L91.90 87.44 L91.98 86.94 L92.01 74.81 L91.97 73.94 L92.01 73.44 L92.19 73.05 L92.56 72.82 L94.19 72.80 L94.56 72.85 L94.81 73.05 L94.94 73.27 L95.03 73.94 L95.00 86.81 L94.94 87.81 L94.78 88.44 L93.81 90.31 L93.31 90.97 L92.94 91.60 L92.73 91.81 L92.06 92.22 L91.56 92.72 L91.19 92.93 L90.19 93.28 L89.56 93.58 L89.06 93.71 L87.81 93.81Z"/></svg></span>
        <span class="product-downloads_text"><span class="product-downloads_label">Installation Manual</span><span class="text-style-muted">Download</span></span>
      </a>
      <a href="#" class="product-downloads_button">
        <span class="product-downloads_icon-wrapper"><svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#000"/><path fill="#fff" fill-rule="evenodd" d="M60.31 99.20 L59.94 99.22 L59.44 99.16 L58.19 98.83 L57.31 98.20 L56.19 97.83 L55.31 97.20 L54.19 96.83 L53.31 96.20 L52.19 95.82 L51.44 95.28 L50.06 94.84 L48.94 94.19 L47.81 93.86 L46.84 93.19 L45.81 92.86 L44.81 92.17 L43.69 91.80 L42.85 91.19 L41.81 90.85 L40.81 90.22 L39.44 89.80 L38.56 89.19 L37.19 88.72 L36.26 88.19 L35.19 87.83 L34.31 87.20 L33.19 86.83 L32.31 86.20 L31.19 85.83 L30.19 85.14 L29.06 84.81 L27.94 84.16 L26.56 83.72 L25.81 83.18 L24.94 82.90 L24.44 82.64 L23.44 81.72 L23.31 81.49 L23.25 81.19 L23.33 80.19 L23.34 39.81 L23.25 38.94 L23.35 38.44 L23.56 38.18 L24.94 37.19 L26.05 36.81 L26.94 36.19 L27.94 35.86 L28.94 35.19 L30.06 34.81 L30.94 34.19 L32.19 33.86 L33.31 33.12 L34.56 32.80 L35.44 32.20 L36.56 31.80 L37.44 31.20 L38.56 30.80 L39.44 30.20 L40.69 29.73 L41.44 29.20 L42.81 28.72 L43.94 28.11 L44.89 27.81 L45.87 27.19 L47.05 26.81 L47.94 26.19 L49.05 25.81 L49.94 25.19 L51.19 24.74 L51.94 24.19 L53.03 23.81 L53.94 23.23 L55.29 22.81 L56.19 22.17 L57.56 21.80 L58.31 21.27 L58.94 21.00 L59.44 20.84 L59.94 20.77 L60.56 20.84 L61.81 21.17 L62.71 21.81 L63.81 22.17 L64.71 22.81 L65.81 23.17 L66.56 23.73 L67.81 24.19 L68.56 24.72 L69.94 25.16 L71.06 25.81 L72.19 26.14 L73.16 26.81 L74.19 27.14 L75.19 27.83 L76.31 28.20 L77.15 28.81 L78.19 29.15 L79.19 29.77 L80.56 30.20 L81.44 30.80 L82.81 31.29 L83.81 31.84 L84.81 32.17 L85.69 32.80 L86.81 33.17 L87.81 33.86 L88.84 34.19 L89.81 34.87 L90.94 35.19 L92.06 35.84 L93.31 36.23 L94.19 36.82 L95.28 37.19 L95.69 37.46 L96.34 38.19 L96.52 38.56 L96.56 38.94 L96.48 39.81 L96.47 80.19 L96.57 81.06 L96.55 81.31 L96.44 81.61 L96.01 82.06 L95.06 82.81 L93.95 83.19 L92.94 83.86 L91.94 84.19 L91.05 84.81 L89.94 85.19 L88.94 85.87 L87.69 86.21 L86.83 86.81 L85.69 87.21 L84.81 87.71 L83.44 88.19 L82.56 88.80 L81.44 89.19 L80.56 89.80 L79.31 90.26 L78.56 90.80 L77.19 91.28 L76.19 91.85 L75.11 92.19 L74.13 92.81 L72.94 93.19 L72.06 93.81 L70.94 94.19 L70.19 94.74 L68.94 95.19 L68.05 95.81 L66.96 96.19 L65.97 96.81 L64.70 97.19 L63.81 97.83 L62.45 98.19 L61.54 98.81 L60.94 99.05 L60.31 99.20ZM77.76 45.44 L78.31 45.14 L79.26 44.81 L80.19 44.28 L81.56 43.80 L82.44 43.20 L83.56 42.80 L84.44 42.20 L85.69 41.73 L86.44 41.20 L87.81 40.72 L88.73 40.19 L89.94 39.73 L90.44 39.33 L90.65 39.06 L90.76 38.69 L90.70 38.44 L90.56 38.28 L90.31 38.15 L89.14 37.81 L88.29 37.19 L87.17 36.81 L86.26 36.19 L85.05 35.81 L83.81 35.10 L82.56 34.72 L81.81 34.18 L80.94 33.91 L80.56 33.73 L79.81 33.17 L78.72 32.81 L77.85 32.19 L76.72 31.81 L75.81 31.17 L74.46 30.81 L73.56 30.19 L72.19 29.72 L71.31 29.21 L70.19 28.83 L69.29 28.19 L68.06 27.76 L67.29 27.19 L66.16 26.81 L65.29 26.19 L64.13 25.81 L63.35 25.31 L62.06 24.84 L61.06 24.24 L60.31 24.04 L59.69 23.99 L59.06 24.11 L58.06 24.81 L56.94 25.19 L56.19 25.74 L54.94 26.19 L54.05 26.81 L52.71 27.19 L51.81 27.83 L50.44 28.19 L49.56 28.80 L48.44 29.20 L47.70 29.69 L46.82 30.06 L46.55 30.31 L46.50 30.44 L46.55 30.69 L46.82 30.94 L47.70 31.31 L48.49 31.81 L49.84 32.19 L50.71 32.81 L51.81 33.17 L52.71 33.81 L53.81 34.17 L54.81 34.86 L55.84 35.19 L56.70 35.81 L57.94 36.19 L59.06 36.84 L60.44 37.28 L61.19 37.82 L62.06 38.09 L62.44 38.27 L63.19 38.83 L64.28 39.19 L65.15 39.81 L66.28 40.19 L67.19 40.83 L68.53 41.19 L69.44 41.80 L70.81 42.29 L71.94 42.89 L72.81 43.17 L73.69 43.80 L74.81 44.17 L75.81 44.86 L76.69 45.14 L77.31 45.47 L77.56 45.50 L77.76 45.44ZM60.54 53.81 L61.44 53.20 L62.69 52.73 L63.44 52.20 L64.69 51.73 L65.44 51.20 L66.81 50.83 L67.72 50.19 L68.94 49.86 L69.26 49.69 L69.81 49.26 L71.05 48.81 L71.94 48.20 L72.94 47.89 L73.19 47.71 L73.28 47.56 L73.27 47.19 L72.97 46.81 L72.44 46.46 L71.81 46.16 L70.81 45.86 L69.84 45.19 L68.81 44.86 L67.81 44.17 L66.69 43.80 L65.85 43.19 L64.73 42.81 L63.73 42.19 L62.44 41.80 L61.56 41.19 L60.19 40.77 L59.28 40.19 L58.16 39.81 L57.29 39.19 L56.16 38.81 L55.29 38.19 L54.16 37.81 L53.29 37.19 L52.06 36.81 L50.81 36.10 L49.69 35.77 L48.81 35.18 L47.94 34.91 L47.56 34.73 L46.84 34.19 L45.81 33.86 L44.84 33.19 L43.81 32.85 L43.06 32.38 L42.69 32.25 L42.31 32.25 L42.06 32.32 L41.19 32.85 L40.06 33.21 L39.13 33.81 L37.94 34.19 L37.06 34.81 L35.94 35.19 L35.19 35.74 L33.94 36.19 L33.05 36.81 L31.96 37.19 L30.94 37.83 L29.69 38.14 L29.44 38.27 L29.29 38.44 L29.23 38.69 L29.36 39.06 L29.94 39.67 L31.30 40.19 L32.19 40.83 L33.28 41.19 L34.19 41.83 L35.53 42.19 L36.44 42.80 L37.81 43.29 L38.94 43.89 L39.81 44.17 L40.56 44.73 L41.84 45.19 L42.71 45.81 L43.84 46.19 L44.70 46.81 L45.94 47.19 L47.06 47.84 L48.44 48.28 L49.19 48.82 L50.06 49.09 L50.44 49.27 L51.16 49.81 L52.19 50.14 L53.15 50.81 L54.28 51.19 L55.19 51.83 L56.06 52.11 L57.19 52.72 L58.53 53.19 L59.44 53.81 L59.94 53.91 L60.54 53.81ZM58.07 94.94 L58.41 94.69 L58.56 94.19 L58.48 93.19 L58.49 58.69 L58.54 57.94 L58.46 57.31 L58.15 56.56 L57.79 56.19 L56.72 55.81 L55.81 55.17 L54.72 54.81 L53.81 54.17 L52.74 53.81 L51.69 53.23 L50.44 52.80 L49.55 52.19 L48.19 51.83 L47.29 51.19 L46.06 50.76 L45.29 50.19 L44.16 49.81 L43.29 49.19 L42.19 48.82 L41.31 48.22 L40.05 47.81 L38.95 47.19 L37.69 46.78 L36.81 46.18 L35.94 45.91 L35.56 45.73 L34.81 45.17 L33.72 44.81 L32.85 44.19 L31.72 43.81 L30.81 43.17 L29.46 42.81 L28.69 42.27 L27.94 41.94 L27.19 41.76 L26.94 41.75 L26.69 41.83 L26.54 41.94 L26.39 42.19 L26.29 42.81 L26.33 78.19 L26.24 79.06 L26.29 79.44 L26.40 79.69 L27.56 80.73 L28.84 81.19 L29.81 81.86 L30.81 82.17 L31.56 82.73 L32.81 83.18 L33.69 83.79 L34.94 84.18 L36.19 84.90 L37.44 85.28 L38.19 85.82 L39.06 86.09 L39.44 86.27 L40.19 86.83 L41.28 87.19 L42.15 87.81 L43.28 88.19 L44.19 88.83 L45.53 89.19 L46.44 89.80 L47.81 90.29 L48.94 90.89 L49.81 91.17 L50.70 91.81 L51.81 92.17 L52.71 92.81 L53.81 93.17 L54.69 93.80 L55.94 94.21 L56.94 94.87 L57.56 95.00 L58.07 94.94ZM62.83 94.94 L63.19 94.77 L63.91 94.19 L65.05 93.81 L66.06 93.14 L67.28 92.81 L68.19 92.17 L69.56 91.80 L70.44 91.20 L71.56 90.80 L72.44 90.20 L73.56 89.80 L74.44 89.20 L75.69 88.73 L76.44 88.20 L77.73 87.81 L78.81 87.15 L80.06 86.73 L80.87 86.19 L82.05 85.81 L82.94 85.19 L84.06 84.81 L84.81 84.26 L86.06 83.81 L86.94 83.19 L88.14 82.81 L89.12 82.19 L90.06 81.89 L91.19 81.29 L92.56 80.80 L92.89 80.56 L93.32 79.94 L93.48 79.56 L93.55 79.06 L93.49 78.19 L93.52 42.94 L93.45 42.19 L93.32 41.94 L93.19 41.83 L92.81 41.78 L91.81 42.02 L91.31 42.27 L90.56 42.80 L89.31 43.26 L88.56 43.80 L87.19 44.17 L86.19 44.86 L84.94 45.23 L84.03 45.81 L82.81 46.26 L82.05 46.81 L80.94 47.19 L80.05 47.81 L78.94 48.19 L78.05 48.81 L76.86 49.19 L75.88 49.81 L74.94 50.10 L73.81 50.71 L72.44 51.19 L71.56 51.80 L70.44 52.19 L69.56 52.80 L68.44 53.19 L67.54 53.81 L66.44 54.19 L65.56 54.80 L64.19 55.17 L63.28 55.81 L62.19 56.13 L61.93 56.31 L61.75 56.56 L61.54 57.19 L61.47 57.94 L61.51 93.19 L61.46 94.19 L61.56 94.69 L61.81 94.95 L62.31 95.02 L62.83 94.94Z"/></svg></span>
        <span class="product-downloads_text"><span class="product-downloads_label">Maintenance Guide</span><span class="text-style-muted">Download</span></span>
      </a>
      <a href="#" class="product-downloads_button">
        <span class="product-downloads_icon-wrapper"><svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#000"/><path fill="#fff" fill-rule="evenodd" d="M61.81 93.82 L57.38 93.81 L54.62 93.19 L53.19 92.99 L52.44 92.81 L51.50 92.31 L50.06 91.96 L48.81 91.28 L47.48 90.81 L46.77 90.19 L45.81 89.81 L45.06 89.23 L44.31 88.84 L43.72 88.19 L42.94 87.81 L41.81 86.80 L39.31 84.21 L38.78 83.44 L38.19 82.84 L37.76 82.19 L37.30 81.69 L37.09 81.31 L36.80 80.56 L36.20 79.81 L35.80 78.94 L35.19 78.02 L34.81 76.47 L34.15 75.44 L33.91 74.19 L33.15 71.69 L32.84 68.69 L32.67 66.31 L32.85 62.19 L33.25 58.44 L33.81 56.57 L34.01 55.19 L34.35 53.69 L34.88 52.31 L35.23 50.69 L35.87 49.69 L36.19 48.30 L36.81 47.27 L37.19 46.19 L37.81 45.29 L38.19 44.19 L38.81 43.29 L39.09 42.44 L39.31 41.98 L40.75 39.94 L41.19 39.19 L42.77 37.19 L43.31 36.32 L43.81 35.84 L44.28 35.19 L44.81 34.73 L45.27 34.19 L45.81 33.74 L46.19 33.26 L46.81 32.74 L47.19 32.27 L47.85 31.81 L48.44 31.21 L49.19 30.78 L49.85 30.19 L50.69 29.71 L51.31 29.13 L52.19 28.73 L52.94 28.19 L54.06 27.81 L55.06 27.13 L56.56 26.81 L57.41 26.44 L57.85 26.31 L59.31 26.18 L61.81 26.21 L64.19 27.01 L65.19 27.18 L65.56 27.35 L66.19 27.82 L67.13 28.19 L67.88 28.81 L68.76 29.19 L69.31 29.71 L70.15 30.19 L70.81 30.78 L71.56 31.21 L72.15 31.81 L72.81 32.27 L73.19 32.74 L73.81 33.26 L74.19 33.74 L74.73 34.19 L75.19 34.73 L75.72 35.19 L76.17 35.81 L76.69 36.32 L77.19 37.07 L77.69 37.61 L78.21 38.56 L78.77 39.19 L79.24 39.94 L79.72 40.44 L80.19 41.52 L80.76 42.19 L81.19 43.09 L81.79 43.94 L82.20 45.06 L82.86 46.06 L83.22 47.31 L83.69 48.17 L83.94 48.80 L84.40 50.31 L84.88 51.19 L85.26 52.81 L85.84 54.56 L86.23 56.81 L86.88 59.19 L87.07 61.44 L87.15 63.31 L87.33 64.81 L87.32 66.44 L87.18 67.31 L87.17 68.56 L86.86 71.69 L86.66 72.56 L86.19 73.64 L85.83 75.31 L85.16 76.81 L84.80 77.81 L84.14 78.81 L83.74 79.94 L82.25 82.06 L81.89 82.69 L81.30 83.31 L80.56 84.43 L78.31 86.69 L77.18 87.69 L76.35 88.19 L75.69 88.85 L74.94 89.23 L74.21 89.81 L73.31 90.26 L72.56 90.80 L71.44 91.19 L70.77 91.69 L70.44 91.85 L69.06 92.13 L67.69 92.78 L66.94 92.97 L65.38 93.19 L62.94 93.70 L61.81 93.82ZM57.91 90.69 L58.19 90.53 L58.41 90.19 L58.49 89.81 L58.51 88.94 L58.52 30.94 L58.48 30.31 L58.36 29.94 L58.06 29.65 L57.69 29.57 L55.45 30.19 L54.69 30.73 L53.81 31.17 L53.06 31.77 L52.23 32.19 L51.69 32.71 L50.81 33.22 L50.19 33.79 L49.49 34.31 L49.02 34.81 L48.31 35.30 L47.81 35.92 L47.31 36.41 L46.81 37.08 L45.19 38.86 L44.69 39.60 L44.19 40.19 L43.75 40.94 L42.19 43.14 L41.72 44.06 L41.19 44.82 L40.73 45.94 L40.19 46.71 L39.80 47.81 L39.28 48.56 L38.96 49.94 L38.19 51.44 L37.75 53.31 L37.19 54.64 L36.81 56.81 L36.34 58.31 L36.06 60.19 L35.67 66.19 L35.95 69.81 L36.16 71.44 L36.78 73.31 L37.15 74.94 L37.79 75.94 L38.19 77.03 L38.72 77.81 L39.25 79.06 L39.81 79.79 L40.30 80.69 L40.78 81.19 L41.19 81.76 L41.77 82.31 L42.14 82.81 L42.67 83.31 L43.08 83.81 L43.69 84.24 L44.18 84.81 L44.81 85.27 L45.40 85.94 L46.04 86.31 L46.44 86.65 L47.50 87.31 L48.06 87.76 L49.28 88.19 L50.15 88.81 L51.56 89.19 L52.44 89.67 L52.94 89.84 L55.44 90.30 L56.94 90.73 L57.56 90.76 L57.91 90.69ZM62.20 45.81 L62.69 45.55 L63.94 44.17 L64.56 43.63 L64.95 43.19 L70.56 37.63 L71.06 37.06 L71.63 36.56 L71.84 36.19 L71.91 35.81 L71.88 35.56 L71.69 35.26 L70.92 34.81 L69.16 33.19 L68.39 32.69 L67.81 32.17 L67.06 31.77 L66.50 31.31 L66.06 31.09 L65.16 30.81 L64.19 30.14 L62.31 29.57 L61.87 29.69 L61.64 29.94 L61.52 30.31 L61.48 30.94 L61.51 44.19 L61.45 45.19 L61.52 45.56 L61.69 45.78 L61.94 45.84 L62.20 45.81ZM62.09 63.69 L62.56 63.45 L62.94 63.13 L63.78 62.19 L78.32 47.69 L79.24 46.69 L79.33 46.31 L79.23 45.94 L78.80 44.94 L78.19 44.01 L77.75 42.94 L77.19 42.21 L76.79 41.44 L76.24 40.81 L75.83 40.19 L75.21 39.56 L74.81 38.82 L74.56 38.61 L74.19 38.63 L73.69 38.87 L73.28 39.19 L72.81 39.75 L72.19 40.26 L71.81 40.74 L71.19 41.26 L70.81 41.74 L70.27 42.19 L69.81 42.74 L69.19 43.26 L68.81 43.74 L68.19 44.26 L67.81 44.74 L67.19 45.26 L66.81 45.74 L66.19 46.26 L65.81 46.74 L65.19 47.26 L64.81 47.74 L64.19 48.26 L63.81 48.74 L63.19 49.26 L62.81 49.74 L62.19 50.25 L61.58 51.31 L61.43 51.81 L61.52 52.81 L61.51 62.19 L61.43 63.19 L61.47 63.44 L61.68 63.69 L62.09 63.69ZM62.09 79.69 L62.56 79.45 L62.94 79.13 L63.78 78.19 L82.19 59.78 L82.56 59.45 L83.31 59.03 L83.56 58.81 L83.70 58.44 L83.67 58.06 L83.24 57.06 L82.90 55.06 L82.64 54.06 L82.14 52.94 L81.81 51.44 L81.06 50.05 L80.81 49.77 L80.44 49.69 L80.06 49.92 L79.44 50.75 L61.87 68.31 L61.57 69.06 L61.48 69.81 L61.51 78.19 L61.43 79.19 L61.47 79.44 L61.68 79.69 L62.09 79.69ZM63.08 90.69 L65.19 90.12 L66.94 89.87 L68.07 89.31 L69.73 88.81 L70.73 88.19 L71.77 87.81 L72.44 87.21 L73.31 86.81 L73.94 86.28 L74.69 85.84 L75.19 85.27 L75.94 84.70 L76.31 84.24 L76.96 83.81 L77.81 82.89 L78.22 82.31 L78.81 81.76 L79.22 81.19 L79.79 80.56 L80.19 79.79 L80.79 78.94 L81.16 78.19 L81.86 77.19 L82.25 75.94 L82.81 74.94 L83.19 73.43 L83.79 71.69 L83.94 70.81 L84.18 68.44 L84.19 67.31 L84.33 66.31 L84.26 63.81 L84.17 63.31 L83.94 62.97 L83.69 62.90 L83.44 62.93 L83.06 63.16 L82.69 63.73 L82.19 64.19 L81.77 64.69 L81.19 65.16 L80.76 65.69 L80.19 66.16 L79.76 66.69 L79.19 67.16 L78.76 67.69 L78.19 68.16 L77.76 68.69 L77.19 69.16 L76.76 69.69 L76.19 70.16 L75.76 70.69 L75.19 71.16 L74.76 71.69 L74.19 72.16 L73.76 72.69 L73.19 73.16 L72.76 73.69 L72.19 74.16 L71.76 74.69 L71.19 75.16 L70.76 75.69 L70.19 76.16 L69.76 76.69 L69.19 77.16 L68.76 77.69 L68.19 78.16 L67.76 78.69 L67.19 79.16 L66.76 79.69 L66.19 80.16 L65.76 80.69 L65.19 81.16 L64.76 81.69 L64.19 82.16 L63.69 82.76 L63.16 83.19 L62.77 83.69 L62.03 84.31 L61.55 85.31 L61.45 85.81 L61.51 86.81 L61.52 89.94 L61.67 90.31 L61.96 90.56 L62.44 90.68 L63.08 90.69Z"/></svg></span>
        <span class="product-downloads_text"><span class="product-downloads_label">Warranty Policy</span><span class="text-style-muted">Download</span></span>
      </a>
      <a href="#" class="product-downloads_button" data-gd-tile="locked">
        <span class="product-downloads_icon-wrapper"><svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#000"/><path fill="#fff" fill-rule="evenodd" d="M65.81 93.81 L53.56 93.83 L52.44 93.68 L51.19 93.67 L47.69 93.33 L46.69 93.18 L45.44 93.16 L43.81 93.01 L42.31 92.96 L40.31 92.74 L37.31 92.13 L34.81 91.83 L33.31 91.35 L31.69 90.96 L30.79 90.81 L30.44 90.65 L29.81 90.18 L28.94 89.91 L28.56 89.73 L28.05 89.31 L27.31 88.88 L27.06 88.65 L26.33 87.69 L26.19 87.31 L26.16 86.94 L26.17 33.19 L26.21 32.81 L26.35 32.44 L27.13 31.31 L28.44 30.21 L29.94 29.69 L31.06 29.13 L32.84 28.81 L34.44 28.25 L35.31 28.09 L37.81 27.84 L39.44 27.42 L41.19 27.15 L45.56 26.88 L51.31 26.32 L52.69 26.31 L54.44 26.17 L66.31 26.16 L67.56 26.32 L68.81 26.33 L72.19 26.65 L73.31 26.82 L74.69 26.84 L78.81 27.15 L80.81 27.45 L82.69 27.87 L85.31 28.19 L87.16 28.81 L89.19 29.18 L89.56 29.35 L90.19 29.82 L91.28 30.19 L92.76 31.19 L93.69 32.36 L93.82 32.69 L93.85 33.06 L93.81 86.19 L93.88 87.19 L93.81 87.56 L93.66 87.81 L92.90 88.69 L91.44 89.86 L90.06 90.31 L88.94 90.87 L86.69 91.35 L85.28 91.81 L81.44 92.32 L80.31 92.64 L78.81 92.85 L76.69 93.03 L74.44 93.12 L68.69 93.68 L67.31 93.69 L65.81 93.81ZM60.83 37.44 L61.81 37.29 L66.19 37.34 L67.56 37.17 L68.81 37.17 L73.56 36.92 L74.81 36.91 L77.56 36.60 L80.44 36.08 L82.69 35.90 L85.19 35.23 L87.69 34.78 L88.94 34.20 L89.94 33.92 L90.23 33.69 L90.30 33.44 L90.19 33.19 L89.94 32.93 L88.69 32.25 L87.81 31.98 L86.44 31.75 L85.56 31.33 L84.81 31.16 L82.44 30.82 L81.19 30.72 L79.56 30.24 L74.69 29.83 L73.31 29.81 L72.31 29.66 L68.81 29.32 L67.44 29.30 L66.19 29.15 L54.19 29.18 L52.69 29.30 L51.31 29.31 L45.56 29.88 L41.31 30.13 L37.81 30.84 L35.44 31.13 L32.81 31.92 L31.69 32.14 L31.06 32.37 L30.31 32.78 L29.94 33.14 L29.82 33.44 L29.89 33.69 L30.19 33.92 L31.31 34.25 L32.44 34.81 L33.81 35.01 L35.19 35.32 L36.44 35.75 L39.44 36.11 L40.61 36.19 L41.56 36.42 L42.69 36.54 L43.44 36.76 L46.69 36.98 L52.69 37.18 L54.44 37.32 L58.31 37.30 L59.94 37.55 L60.83 37.44ZM65.91 90.81 L67.31 90.69 L68.69 90.68 L74.44 90.12 L78.56 89.88 L79.44 89.70 L80.56 89.60 L82.31 89.14 L84.69 88.90 L85.56 88.67 L86.94 88.15 L88.69 87.77 L90.44 86.83 L90.67 86.56 L90.70 86.31 L90.63 86.06 L89.72 84.81 L89.61 84.56 L89.59 84.31 L89.75 83.81 L90.02 83.31 L90.71 82.56 L90.84 81.94 L90.81 38.81 L90.89 37.81 L90.78 37.31 L90.49 37.06 L90.06 37.02 L89.19 37.27 L88.06 37.76 L85.81 38.14 L84.31 38.64 L81.94 39.00 L80.19 39.10 L77.69 39.57 L75.06 39.88 L71.56 40.07 L67.56 40.16 L66.19 40.33 L61.69 40.29 L59.94 40.54 L58.31 40.29 L54.44 40.31 L52.56 40.17 L50.69 40.18 L43.31 39.74 L40.69 39.25 L37.56 38.89 L36.40 38.81 L34.81 38.30 L31.94 37.76 L30.81 37.27 L30.19 37.09 L29.69 37.06 L29.35 37.19 L29.17 37.44 L29.10 37.81 L29.19 38.69 L29.15 81.94 L29.28 82.56 L29.91 83.19 L30.17 83.56 L30.31 83.94 L30.35 84.31 L30.09 85.06 L29.84 85.44 L29.39 85.94 L29.25 86.19 L29.23 86.44 L29.31 86.69 L29.56 86.89 L30.31 87.22 L31.31 87.77 L32.06 87.99 L33.09 88.19 L34.44 88.68 L36.31 89.01 L38.81 89.28 L40.44 89.76 L45.31 90.17 L46.69 90.19 L47.69 90.34 L51.19 90.68 L52.56 90.69 L53.69 90.84 L65.91 90.81ZM62.44 81.71 L61.81 81.79 L60.31 81.67 L58.81 81.67 L57.94 81.75 L57.56 81.71 L57.06 81.39 L56.56 80.81 L56.41 80.44 L56.45 79.94 L56.71 79.44 L57.06 79.09 L57.44 78.91 L58.31 78.71 L60.56 78.68 L62.56 78.85 L62.94 79.06 L63.29 79.44 L63.55 79.94 L63.61 80.31 L63.57 80.56 L63.34 80.94 L62.81 81.48 L62.44 81.71ZM50.31 81.95 L49.56 82.00 L49.06 81.92 L48.68 81.69 L48.19 81.06 L48.05 80.44 L48.12 79.94 L48.34 79.56 L48.80 79.19 L49.31 79.02 L49.94 78.97 L52.31 78.94 L53.56 78.83 L54.44 79.02 L54.71 79.19 L54.91 79.44 L55.05 80.06 L54.98 80.69 L54.69 81.23 L54.19 81.60 L53.69 81.79 L52.94 81.91 L50.81 81.90 L50.31 81.95ZM70.81 81.95 L69.94 82.00 L69.19 81.94 L67.19 81.92 L65.81 81.68 L65.31 81.33 L65.01 80.81 L64.91 80.19 L65.04 79.56 L65.19 79.30 L65.48 79.06 L65.81 78.94 L66.44 78.83 L70.44 79.00 L70.94 79.10 L71.31 79.33 L71.77 79.81 L71.92 80.19 L71.94 80.56 L71.86 80.94 L71.66 81.31 L71.19 81.78 L70.81 81.95ZM41.94 82.70 L41.19 82.79 L40.69 82.71 L40.33 82.44 L39.88 81.81 L39.71 81.44 L39.73 81.06 L39.98 80.44 L40.31 80.10 L41.69 79.65 L42.69 79.58 L43.31 79.43 L44.31 79.35 L45.19 79.19 L45.56 79.26 L45.81 79.42 L46.44 80.05 L46.62 80.31 L46.75 80.81 L46.68 81.31 L46.42 81.69 L45.94 82.00 L45.31 82.20 L41.94 82.70ZM78.81 82.82 L78.19 82.80 L77.31 82.55 L76.19 82.45 L74.56 82.18 L74.19 82.04 L73.69 81.69 L73.38 81.31 L73.23 80.81 L73.31 80.28 L73.55 79.94 L74.12 79.44 L74.44 79.26 L74.81 79.19 L76.44 79.50 L77.81 79.64 L79.69 80.01 L79.94 80.19 L80.16 80.56 L80.27 81.06 L80.23 81.44 L79.97 81.94 L79.56 82.44 L79.19 82.72 L78.81 82.82ZM33.44 84.08 L32.69 84.14 L32.31 84.05 L31.76 83.69 L31.42 83.19 L31.36 82.81 L31.44 82.43 L32.06 81.53 L32.44 81.20 L32.81 81.08 L33.69 81.02 L34.92 80.81 L36.44 80.42 L37.06 80.35 L37.38 80.44 L37.69 80.65 L38.41 81.56 L38.49 81.94 L38.36 82.44 L38.10 82.81 L37.69 83.09 L34.94 83.84 L33.44 84.08ZM87.56 84.09 L86.94 84.12 L84.81 83.83 L84.23 83.69 L83.56 83.42 L82.44 83.14 L82.06 82.88 L81.78 82.44 L81.64 81.94 L81.72 81.44 L82.06 80.94 L82.41 80.56 L82.69 80.39 L82.94 80.34 L83.56 80.42 L85.06 80.81 L86.31 81.02 L87.19 81.08 L87.53 81.19 L87.81 81.39 L88.52 82.19 L88.65 82.44 L88.69 82.69 L88.59 83.06 L88.31 83.50 L87.94 83.88 L87.56 84.09Z"/></svg></span>
        <span class="product-downloads_text"><span class="product-downloads_label">2D &amp; 3D CAD Files</span><span class="register-button text-style-muted"><svg class="icon-embed-xxsmall" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg><span>Register to access</span></span></span>
      </a>
    </div>
  </div>
</div>
</div></figure>
<figure class="mpg-item" data-c="hero"><figcaption class="mpg-tag">Hero carousel</figcaption><div class="mpg-sel">
<div class="mos mos-c" data-c="hero" data-name="Hero carousel">
  <div class="home-hero_tabs" role="group" aria-roledescription="carousel" aria-label="Featured projects">
    <div class="home-hero_content-list" aria-live="off">
      <div class="home-hero_content-item is-content-active" role="group" aria-roledescription="slide" aria-label="1 of 5: IGLU Summer Hill">
        <div class="home-hero_image-wrapper">
          <div class="home-hero_overlay"></div>
          <img class="home-hero_image is-landscape" src="/mos-playground/hero-1-l.jpg" alt="IGLU Summer Hill" loading="eager">
          <img class="home-hero_image is-portrait" src="/mos-playground/hero-1-p.jpg" alt="IGLU Summer Hill" loading="lazy">
        </div>
        <div class="home-hero_content-wrapper">
          <div class="max-width-large"><h2 class="heading-style-h2">Verge seating pods help shape this laid-back, village-style student accommodation.</h2></div>
          <div class="button-group margin-top-medium">
            <a href="#" class="link_button"><span class="link_button-icon"><span class="link_button-icon-bg is-secondary"></span><span class="link_button-icon-arrow is-secondary"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"/></svg></span></span><span class="text-style-allcaps">See Case Study</span></a>
          </div>
        </div>
      </div>
      <div class="home-hero_content-item" role="group" aria-roledescription="slide" aria-label="2 of 5: Westmead Hospital">
        <div class="home-hero_image-wrapper">
          <div class="home-hero_overlay"></div>
          <img class="home-hero_image is-landscape" src="/mos-playground/hero-2-l.jpg" alt="Westmead Hospital" loading="lazy">
          <img class="home-hero_image is-portrait" src="/mos-playground/hero-2-p.jpg" alt="Westmead Hospital" loading="lazy">
        </div>
        <div class="home-hero_content-wrapper">
          <div class="max-width-large"><h2 class="heading-style-h2">Custom seating solutions unite people, place, and purpose across one of NSW’s most vital community hubs.</h2></div>
          <div class="button-group margin-top-medium">
            <a href="#" class="link_button"><span class="link_button-icon"><span class="link_button-icon-bg is-secondary"></span><span class="link_button-icon-arrow is-secondary"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"/></svg></span></span><span class="text-style-allcaps">See Case Study</span></a>
          </div>
        </div>
      </div>
      <div class="home-hero_content-item" role="group" aria-roledescription="slide" aria-label="3 of 5: Footscray Hospital">
        <div class="home-hero_image-wrapper">
          <div class="home-hero_overlay"></div>
          <img class="home-hero_image is-landscape" src="/mos-playground/hero-3-l.jpg" alt="Footscray Hospital" loading="lazy">
          <img class="home-hero_image is-portrait" src="/mos-playground/hero-3-p.jpg" alt="Footscray Hospital" loading="lazy">
        </div>
        <div class="home-hero_content-wrapper">
          <div class="max-width-large"><h2 class="heading-style-h2">Sturt wall-top seats, benches and picnic sets, with Verge cafe furniture, across Footscray Hospital.</h2></div>
          <div class="button-group margin-top-medium">
            <a href="#" class="link_button"><span class="link_button-icon"><span class="link_button-icon-bg is-secondary"></span><span class="link_button-icon-arrow is-secondary"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"/></svg></span></span><span class="text-style-allcaps">See Case Study</span></a>
          </div>
        </div>
      </div>
      <div class="home-hero_content-item" role="group" aria-roledescription="slide" aria-label="4 of 5: Eastwood Private Hospital">
        <div class="home-hero_image-wrapper">
          <div class="home-hero_overlay"></div>
          <img class="home-hero_image is-landscape" src="/mos-playground/hero-4-l.jpg" alt="Eastwood Private Hospital" loading="lazy">
          <img class="home-hero_image is-portrait" src="/mos-playground/hero-4-p.jpg" alt="Eastwood Private Hospital" loading="lazy">
        </div>
        <div class="home-hero_content-wrapper">
          <div class="max-width-large"><h2 class="heading-style-h2">Verge curved seats and benches, stools and cafe tables furnish the outdoor spaces at Eastwood Private Hospital.</h2></div>
          <div class="button-group margin-top-medium">
            <a href="#" class="link_button"><span class="link_button-icon"><span class="link_button-icon-bg is-secondary"></span><span class="link_button-icon-arrow is-secondary"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"/></svg></span></span><span class="text-style-allcaps">See Case Study</span></a>
          </div>
        </div>
      </div>
      <div class="home-hero_content-item" role="group" aria-roledescription="slide" aria-label="5 of 5: Cathwest College – Loyola">
        <div class="home-hero_image-wrapper">
          <div class="home-hero_overlay"></div>
          <img class="home-hero_image is-landscape" src="/mos-playground/hero-5-l.jpg" alt="Cathwest College – Loyola" loading="lazy">
          <img class="home-hero_image is-portrait" src="/mos-playground/hero-5-p.jpg" alt="Cathwest College – Loyola" loading="lazy">
        </div>
        <div class="home-hero_content-wrapper">
          <div class="max-width-large"><h2 class="heading-style-h2">Oxley benches, seats and picnic sets give students at Cathwest College – Loyola places to gather outdoors.</h2></div>
          <div class="button-group margin-top-medium">
            <a href="#" class="link_button"><span class="link_button-icon"><span class="link_button-icon-bg is-secondary"></span><span class="link_button-icon-arrow is-secondary"><svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true"><path fill="currentColor" d="M6 6v2h8.59L5 17.59L6.41 19L16 9.41V18h2V6z"/></svg></span></span><span class="text-style-allcaps">See Case Study</span></a>
          </div>
        </div>
      </div>
    </div>
    <div class="home-hero_tab-wrapper">
      <div class="home-hero_tab-list" role="group" aria-label="Choose a featured project">
        <button type="button" class="home-hero_tab-item is-tab-active" aria-label="01 IGLU Summer Hill, 1 of 5" aria-current="true" data-name="IGLU Summer Hill"><span class="home-hero_progress-bar"><span class="home-hero_progress-fill"></span></span><span class="home-hero_tab-label"><span class="home-hero_tab-index">01</span></span></button>
        <button type="button" class="home-hero_tab-item" aria-label="02 Westmead Hospital, 2 of 5" aria-current="false" data-name="Westmead Hospital"><span class="home-hero_progress-bar"><span class="home-hero_progress-fill"></span></span><span class="home-hero_tab-label"><span class="home-hero_tab-index">02</span></span></button>
        <button type="button" class="home-hero_tab-item" aria-label="03 Footscray Hospital, 3 of 5" aria-current="false" data-name="Footscray Hospital"><span class="home-hero_progress-bar"><span class="home-hero_progress-fill"></span></span><span class="home-hero_tab-label"><span class="home-hero_tab-index">03</span></span></button>
        <button type="button" class="home-hero_tab-item" aria-label="04 Eastwood Private Hospital, 4 of 5" aria-current="false" data-name="Eastwood Private Hospital"><span class="home-hero_progress-bar"><span class="home-hero_progress-fill"></span></span><span class="home-hero_tab-label"><span class="home-hero_tab-index">04</span></span></button>
        <button type="button" class="home-hero_tab-item" aria-label="05 Cathwest College – Loyola, 5 of 5" aria-current="false" data-name="Cathwest College – Loyola"><span class="home-hero_progress-bar"><span class="home-hero_progress-fill"></span></span><span class="home-hero_tab-label"><span class="home-hero_tab-index">05</span></span></button>
      </div>
      <button type="button" class="home-hero_pause" aria-label="Pause carousel" hidden><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg></button>
    </div>
    <div class="home-hero_active-name"><span aria-hidden="true" class="home-hero_counter">01 / 05</span><span class="home-hero_name">IGLU Summer Hill</span></div>
  </div>
</div>
</div></figure>
<figure class="mpg-item" data-c="gallery"><figcaption class="mpg-tag">Gallery slider</figcaption><div class="mpg-sel">
<div class="mos mos-c" data-c="gallery" data-name="Gallery slider">
  <div class="section_featured-products">
    <div class="cms-slider_component">
      <div class="cms-slider_heading-span"><h2 class="heading-style-h2">Oxley</h2><h2 class="heading-style-h2">installed. Across Australia.</h2></div>
      <div class="cms-slider_track" role="region" aria-roledescription="carousel" aria-label="Oxley installed. Across Australia.">
        <div class="cms-slider_mask">
          <div class="cms-slider_slide" role="group" aria-roledescription="slide" aria-label="1 of 5">
            <a href="#" class="cms-slider_item-link">
              <span class="cms-slider_image-wrapper"><img class="cms-slider_image" src="/mos-playground/gal-footscray.jpg" alt="" loading="lazy"></span>
              <span class="cms-slider_text-wrapper"><span class="text-size-regular">Footscray Hospital</span><span class="text-style-muted">Health &amp; Aged Care</span></span>
            </a>
          </div>
          <div class="cms-slider_slide" role="group" aria-roledescription="slide" aria-label="2 of 5">
            <a href="#" class="cms-slider_item-link">
              <span class="cms-slider_image-wrapper"><img class="cms-slider_image" src="/mos-playground/gal-westbrook.jpg" alt="" loading="lazy"></span>
              <span class="cms-slider_text-wrapper"><span class="text-size-regular">Westbrook Estate</span><span class="text-style-muted">Urban Development</span></span>
            </a>
          </div>
          <div class="cms-slider_slide" role="group" aria-roledescription="slide" aria-label="3 of 5">
            <a href="#" class="cms-slider_item-link">
              <span class="cms-slider_image-wrapper"><img class="cms-slider_image" src="/mos-playground/gal-shell-cove.jpg" alt="" loading="lazy"></span>
              <span class="cms-slider_text-wrapper"><span class="text-size-regular">Shell Cove – Marina</span><span class="text-style-muted">Urban Development</span></span>
            </a>
          </div>
          <div class="cms-slider_slide" role="group" aria-roledescription="slide" aria-label="4 of 5">
            <a href="#" class="cms-slider_item-link">
              <span class="cms-slider_image-wrapper"><img class="cms-slider_image" src="/mos-playground/gal-rosenthal.jpg" alt="" loading="lazy"></span>
              <span class="cms-slider_text-wrapper"><span class="text-size-regular">Rosenthal Estate</span><span class="text-style-muted">Urban Development</span></span>
            </a>
          </div>
          <div class="cms-slider_slide" role="group" aria-roledescription="slide" aria-label="5 of 5">
            <a href="#" class="cms-slider_item-link">
              <span class="cms-slider_image-wrapper"><img class="cms-slider_image" src="/mos-playground/gal-rosebery.jpg" alt="" loading="lazy"></span>
              <span class="cms-slider_text-wrapper"><span class="text-size-regular">Rosebery Engine Yard</span><span class="text-style-muted">Urban Development</span></span>
            </a>
          </div>
        </div>
        <div class="cms-slider_nav" role="group" aria-label="Choose a slide">
          <button type="button" class="w-slider-dot w-active" aria-label="Show slide 1 of 5" aria-pressed="true"></button>
          <button type="button" class="w-slider-dot" aria-label="Show slide 2 of 5" aria-pressed="false"></button>
          <button type="button" class="w-slider-dot" aria-label="Show slide 3 of 5" aria-pressed="false"></button>
          <button type="button" class="w-slider-dot" aria-label="Show slide 4 of 5" aria-pressed="false"></button>
          <button type="button" class="w-slider-dot" aria-label="Show slide 5 of 5" aria-pressed="false"></button>
        </div>
        <button type="button" class="slider-arrow is-bottom-previous" aria-label="previous slide" aria-disabled="true" tabindex="-1"><span class="slider-arrow_icon"><svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.31066 8.75001L9.03033 14.4697L7.96967 15.5303L0.439339 8.00001L7.96967 0.469676L9.03033 1.53034L3.31066 7.25001L15.5 7.25L15.5 8.75L3.31066 8.75001Z" fill="currentColor"/></svg></span></button>
        <button type="button" class="slider-arrow is-bottom-next" aria-label="next slide"><span class="slider-arrow_icon"><svg width="100%" height="100%" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M12.6893 7.25L6.96967 1.53033L8.03033 0.469666L15.5607 8L8.03033 15.5303L6.96967 14.4697L12.6893 8.75H0.5V7.25H12.6893Z" fill="currentColor"/></svg></span></button>
      </div>
    </div>
  </div>
</div>
</div></figure>
<figure class="mpg-item" data-c="filters"><figcaption class="mpg-tag">Filter bar</figcaption><div class="mpg-sel">
<div class="mos mos-c" data-c="filters" data-name="Filter bar">
  <div class="section_filters3">
    <div class="filters3_band">
      <div class="filters3_band-layout">
        <div class="filters3_band-heading"><div class="heading-style-h1">Projects</div></div>
        <div class="filters3_band-search">
          <div class="input2_component">
            <input class="filters3_search-input" type="text" maxlength="256" placeholder="Enter a keyword" aria-label="Search projects" autocomplete="off">
            <span class="form-icon-left"><span class="icon-embed-xsmall"><svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 18C11.775 17.9996 13.4988 17.4054 14.897 16.312L19.293 20.708L20.707 19.294L16.311 14.898C17.405 13.4997 17.9996 11.7754 18 10C18 5.589 14.411 2 10 2C5.589 2 2 5.589 2 10C2 14.411 5.589 18 10 18ZM10 4C13.309 4 16 6.691 16 10C16 13.309 13.309 16 10 16C6.691 16 4 13.309 4 10C4 6.691 6.691 4 10 4Z" fill="currentColor"/></svg></span></span>
          </div>
        </div>
      </div>
    </div>
    <div class="filters3_bar">
      <div class="filters3_feed-header-top is-bar">
        <button type="button" class="filters3_filters-button is-bar" aria-expanded="false"><span class="text-style-label">Add filter</span><span class="icon-embed-xsmall"><svg width="100%" height="100%" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.5" d="m6 9 6 6 6-6"/></svg></span></button>
        <div class="filters3_tags-wrapper is-bar"></div>
        <template class="m-tag-tpl"><button type="button" class="filters3_tag is-outline"><span class="tag_icon-wrapper"><span class="icon-embed-xsmall is-lightmode"><svg width="100%" height="100%" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/></svg></span></span><span class="filters3_tag-label"><span class="text-style-label"></span></span></button></template>
        <div class="filters3_modal is-popover is-wide" role="dialog" aria-modal="true" aria-label="Filters" aria-hidden="true">
          <div class="filters3_modal-content-wrapper">
            <div class="filters3_panel color-scheme-4">
              <div class="filters3_form-header"><div class="heading-style-h3">Filters</div></div>
              <div class="filters3_filter-group-list">
                <div class="filters3_filter-group" data-field="Typology">
                  <div class="filters3_filter-group-heading"><div class="text-size-regular text-weight-medium">Filter by typology:</div><button type="button" class="button is-clear m-clear-group" data-field="Typology"><span class="button_text">Clear</span></button></div>
                  <div class="filters3_group-label">Typology</div>
                  <div class="filters3_filter-options">
                    <div class="filters3_list is-checkbox2">
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Commercial"><span class="filters3_form-checkbox2-label">Commercial</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Community Centre"><span class="filters3_form-checkbox2-label">Community Centre</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Education &amp; Child Care"><span class="filters3_form-checkbox2-label">Education &amp; Child Care</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Health &amp; Aged Care"><span class="filters3_form-checkbox2-label">Health &amp; Aged Care</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Hospitality"><span class="filters3_form-checkbox2-label">Hospitality</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Local Council"><span class="filters3_form-checkbox2-label">Local Council</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Mixed Development"><span class="filters3_form-checkbox2-label">Mixed Development</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Residential Development"><span class="filters3_form-checkbox2-label">Residential Development</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Retail"><span class="filters3_form-checkbox2-label">Retail</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Sports &amp; Entertainment"><span class="filters3_form-checkbox2-label">Sports &amp; Entertainment</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Town Centre"><span class="filters3_form-checkbox2-label">Town Centre</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Transport"><span class="filters3_form-checkbox2-label">Transport</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Typology" value="Urban Development"><span class="filters3_form-checkbox2-label">Urban Development</span></label>
                    </div>
                  </div>
                </div>
                <div class="filters3_filter-group" data-field="State">
                  <div class="filters3_filter-group-heading"><div class="text-size-regular text-weight-medium">Filter by state:</div><button type="button" class="button is-clear m-clear-group" data-field="State"><span class="button_text">Clear</span></button></div>
                  <div class="filters3_group-label">State</div>
                  <div class="filters3_filter-options">
                    <div class="filters3_list is-checkbox2">
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="State" value="ACT"><span class="filters3_form-checkbox2-label">ACT</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="State" value="NSW"><span class="filters3_form-checkbox2-label">NSW</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="State" value="QLD"><span class="filters3_form-checkbox2-label">QLD</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="State" value="SA"><span class="filters3_form-checkbox2-label">SA</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="State" value="VIC"><span class="filters3_form-checkbox2-label">VIC</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="State" value="WA"><span class="filters3_form-checkbox2-label">WA</span></label>
                    </div>
                  </div>
                </div>
                <div class="filters3_filter-group" data-field="Category">
                  <div class="filters3_filter-group-heading"><div class="text-size-regular">Filter by category:</div><button type="button" class="button is-clear m-clear-group" data-field="Category"><span class="button_text">Clear</span></button></div>
                  <div class="filters3_group-label">Category</div>
                  <div class="filters3_filter-options">
                    <div class="filters3_list is-checkbox2">
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Seats"><span class="filters3_form-checkbox2-label">Seats</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Benches"><span class="filters3_form-checkbox2-label">Benches</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Chairs"><span class="filters3_form-checkbox2-label">Chairs</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Stools"><span class="filters3_form-checkbox2-label">Stools</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Tables"><span class="filters3_form-checkbox2-label">Tables</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Platforms"><span class="filters3_form-checkbox2-label">Platforms</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Bins"><span class="filters3_form-checkbox2-label">Bins</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Bike Racks"><span class="filters3_form-checkbox2-label">Bike Racks</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Bollards"><span class="filters3_form-checkbox2-label">Bollards</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Picnic Sets"><span class="filters3_form-checkbox2-label">Picnic Sets</span></label>
                      <label class="filters3_form-checkbox2 is-list-emptyfacet"><input type="checkbox" class="m-sr" data-field="Category" value="Cafe Sets"><span class="filters3_form-checkbox2-label">Cafe Sets</span></label>
                      <label class="filters3_form-checkbox2 is-list-emptyfacet"><input type="checkbox" class="m-sr" data-field="Category" value="Bar Sets"><span class="filters3_form-checkbox2-label">Bar Sets</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Category" value="Podiums"><span class="filters3_form-checkbox2-label">Podiums</span></label>
                    </div>
                  </div>
                </div>
                <div class="filters3_filter-group" data-field="Range">
                  <div class="filters3_filter-group-heading"><div class="text-size-regular">Filter by range:</div><button type="button" class="button is-clear m-clear-group" data-field="Range"><span class="button_text">Clear</span></button></div>
                  <div class="filters3_group-label">Range</div>
                  <div class="filters3_filter-options">
                    <div class="filters3_list is-checkbox2">
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Range" value="Oxley"><span class="filters3_form-checkbox2-label">Oxley</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Range" value="Sturt"><span class="filters3_form-checkbox2-label">Sturt</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Range" value="Verge"><span class="filters3_form-checkbox2-label">Verge</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Range" value="Eyre"><span class="filters3_form-checkbox2-label">Eyre</span></label>
                      <label class="filters3_form-checkbox2 is-list-emptyfacet"><input type="checkbox" class="m-sr" data-field="Range" value="Rollo"><span class="filters3_form-checkbox2-label">Rollo</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Range" value="Taylor"><span class="filters3_form-checkbox2-label">Taylor</span></label>
                      <label class="filters3_form-checkbox2"><input type="checkbox" class="m-sr" data-field="Range" value="Custom"><span class="filters3_form-checkbox2-label">Custom</span></label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="filters3_modal-menu"><button type="button" class="button is-secondary m-clear-all"><span>Clear filters</span></button><button type="button" class="button is-alternate m-close">Close</button></div>
            </div>
            <button type="button" class="filters3_tablet-modal-close-button" aria-label="Close filters"><span class="icon-embed-small"><svg width="100%" height="100%" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"/></svg></span></button>
          </div>
          <div class="filters3_modal-background-overlay"></div>
        </div>
        <div class="filters3_results-wrapper is-bar"><div class="text-style-muted text-style-label"><span class="m-results">136</span> / <span class="m-items">136</span><span> results</span></div></div>
        <a href="#" class="filters3_clear-all m-clear-all">Clear all</a>
        <div class="projects_view-toggle" role="group" aria-label="View">
          <button class="projects_view-button" type="button" data-view="grid" aria-pressed="true"><span aria-hidden="true">▦</span>Grid</button>
          <button class="projects_view-button" type="button" data-view="map" aria-pressed="false"><span aria-hidden="true">●</span>Map</button>
        </div>
      </div>
    </div>
  </div>
</div>
</div></figure>
<figure class="mpg-item" data-c="specs"><figcaption class="mpg-tag">Specs accordion</figcaption><div class="mpg-sel">
<div class="mos mos-c" data-c="specs" data-name="Specs accordion">
  <div class="section_product-specs">
    <div class="accordion_component">
      <h2 class="heading-style-h2 m-section-title">Product Specifications</h2>
      <div class="accordion_list">
        <div class="accordion_item">
          <div class="accordion_question" role="button" tabindex="0" aria-expanded="true">
            <h3 class="heading-style-h5">Dimensions &amp; Fixings</h3>
            <span class="accordion_icon-wrapper" aria-hidden="true"></span>
          </div>
          <div class="accordion_answer">
            <div class="accordion_answer-inner">
              <div class="specs_row"><div class="text-size-regular">Dimensions of base product</div><div class="text-style-muted">W:1800mm H:762mm D:618mm</div></div>
              <div class="specs_row"><div class="text-size-regular">Fixing options</div><div class="features_list"><div class="text-style-muted">Surface</div><div class="text-style-muted">Subsurface</div><div class="text-style-muted">Wall Top</div><div class="text-style-muted">Wall Face</div></div></div>
              <div class="specs_row"><div class="text-size-regular">Slats</div><div class="text-style-muted">Australian hardwood, bamboo, composite or aluminium.</div></div>
              <div class="specs_row"><div class="text-size-regular">Frame</div><div class="text-style-muted">Powder coated aluminium, or Brushed 304 grade stainless steel.</div></div>
              <div class="specs_row"><div class="text-size-regular">Armrest</div><div class="text-style-muted">Powder coated or brushed 304 grade stainless steel.</div></div>
            </div>
          </div>
        </div>
        <div class="accordion_item">
          <div class="accordion_question" role="button" tabindex="0" aria-expanded="true">
            <h3 class="heading-style-h5">Colours</h3>
            <span class="accordion_icon-wrapper" aria-hidden="true"></span>
          </div>
          <div class="accordion_answer is-last">
            <div class="accordion_answer-inner">
              <div class="colours_list">
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#d4d4d4"><img class="colours_swatch-image" src="/mos-playground/swatch-natural.jpg" alt="" loading="lazy"></div></div><div class="materials_item"><div class="text-size-regular">Natural</div><div class="product_label is-tiny">Natural finished metal</div></div></div>
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#101010"></div></div><div class="materials_item"><div class="text-size-regular">Black</div><div class="product_label is-tiny">Powder coat</div></div></div>
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#ffffff"></div></div><div class="materials_item"><div class="text-size-regular">White</div><div class="product_label is-tiny">Powder coat</div></div></div>
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#454545"></div></div><div class="materials_item"><div class="text-size-regular">Monument</div><div class="product_label is-tiny">Powder coat</div></div></div>
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#c4b6a1"></div></div><div class="materials_item"><div class="text-size-regular">Paperbark</div><div class="product_label is-tiny">Powder coat</div></div></div>
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#3c4d57"></div></div><div class="materials_item"><div class="text-size-regular">Deep Ocean</div><div class="product_label is-tiny">Powder coat</div></div></div>
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#34463b"></div></div><div class="materials_item"><div class="text-size-regular">Hawthorne Green</div><div class="product_label is-tiny">Powder coat</div></div></div>
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#704c40"></div></div><div class="materials_item"><div class="text-size-regular">Core Ten</div><div class="product_label is-tiny">Powder coat</div></div></div>
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#56393c"></div></div><div class="materials_item"><div class="text-size-regular">Claret</div><div class="product_label is-tiny">Powder coat</div></div></div>
                <div class="colours_item"><div class="colours_swatch-wrapper"><div class="colours_swatch" style="background-color:#deac3d"></div></div><div class="materials_item"><div class="text-size-regular">Beachouse Yellow</div><div class="product_label is-tiny">Powder coat</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div></figure>
<figure class="mpg-item" data-c="list"><figcaption class="mpg-tag">List reveal</figcaption><div class="mpg-sel">
<div class="mos mos-c" data-c="list" data-name="List reveal" data-empty="false">
  <div class="filters3_feed">
    <div class="feed_wrapper">
      <div class="feed_list" role="list">
        <div class="feed_item" role="listitem" style="--fs-list-renderindex:0">
          <a href="#" class="card_component">
            <span class="card_image-wrapper margin-bottom-xsmall"><img class="card_image" src="/mos-playground/card-wickham.jpg" alt="100 Wickham Street" loading="lazy"></span>
            <span class="projects_card-title"><span class="text-size-regular">100 Wickham Street</span></span>
            <span class="projects_card-typology"><span class="text-style-muted text-style-label">Commercial</span></span>
          </a>
        </div>
        <div class="feed_item" role="listitem" style="--fs-list-renderindex:1">
          <a href="#" class="card_component">
            <span class="card_image-wrapper margin-bottom-xsmall"><img class="card_image" src="/mos-playground/card-kent.jpg" alt="309 Kent St" loading="lazy"></span>
            <span class="projects_card-title"><span class="text-size-regular">309 Kent St</span></span>
            <span class="projects_card-typology"><span class="text-style-muted text-style-label">Commercial</span></span>
          </a>
        </div>
        <div class="feed_item" role="listitem" style="--fs-list-renderindex:2">
          <a href="#" class="card_component">
            <span class="card_image-wrapper margin-bottom-xsmall"><img class="card_image" src="/mos-playground/card-abbotsleigh.jpg" alt="Abbotsleigh" loading="lazy"></span>
            <span class="projects_card-title"><span class="text-size-regular">Abbotsleigh</span></span>
            <span class="projects_card-typology"><span class="text-style-muted text-style-label">Education &amp; Child Care</span></span>
          </a>
        </div>
        <div class="feed_item" role="listitem" style="--fs-list-renderindex:3">
          <a href="#" class="card_component">
            <span class="card_image-wrapper margin-bottom-xsmall"><img class="card_image" src="/mos-playground/card-alira.jpg" alt="Alira Wetland" loading="lazy"></span>
            <span class="projects_card-title"><span class="text-size-regular">Alira Wetland</span></span>
            <span class="projects_card-typology"><span class="text-style-muted text-style-label">Urban Development</span></span>
          </a>
        </div>
        <div class="feed_item" role="listitem" style="--fs-list-renderindex:4">
          <a href="#" class="card_component">
            <span class="card_image-wrapper margin-bottom-xsmall"><img class="card_image" src="/mos-playground/card-amara.jpg" alt="Amara Apartments" loading="lazy"></span>
            <span class="projects_card-title"><span class="text-size-regular">Amara Apartments</span></span>
            <span class="projects_card-typology"><span class="text-style-muted text-style-label">Residential Development</span></span>
          </a>
        </div>
        <div class="feed_item" role="listitem" style="--fs-list-renderindex:5">
          <a href="#" class="card_component">
            <span class="card_image-wrapper margin-bottom-xsmall"><img class="card_image" src="/mos-playground/card-bay-pavilions.jpg" alt="Bay Pavilions" loading="lazy"></span>
            <span class="projects_card-title"><span class="text-size-regular">Bay Pavilions</span></span>
            <span class="projects_card-typology"><span class="text-style-muted text-style-label">Sports &amp; Entertainment</span></span>
          </a>
        </div>
      </div>
    </div>
    <div class="feed_loading" aria-hidden="true">Loading more projects</div>
    <div class="feed_empty-state" hidden>
      <div class="heading-style-h6 margin-bottom-xsmall">No results found.</div>
      <div class="text-size-medium text-style-muted margin-bottom-xsmall">There are no results with this criteria. Try changing your search.</div>
      <a href="#" class="button is-secondary m-empty-clear">Clear all filters</a>
    </div>
  </div>
</div>
</div></figure>
`;
