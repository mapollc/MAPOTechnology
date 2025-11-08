<!DOCTYPE html>

<html>
<head>
    <title>La Grande Ride - We build recreation maps and provide outdoor recreation services</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=1" />
    <meta name="description" content="La Grande Ride buils recreation maps and provides outdoor recreation services." />
    <meta name="robots" content="index,follow" />
    <meta name="theme-color" content="#ab6f00" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald&family=Source+Sans+Pro&display=swap" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css">
    <link rel="stylesheet" href="style.css">
    <link rel="shortcut icon" href="https://www.lagranderide.com/sites/lagranderide.com/files/cti_flex_favicon_2.ico" type="image/vnd.microsoft.icon" />
</head>
<body>

    <header id="home" class="d-flex flex-wrap justify-content-center py-3">
        <div class="container d-flex" style="align-items:center">
            <a href="/" class="d-flex align-items-center mb-0 mb-md-0 me-md-auto">
                <img class="logo" src="https://www.lagranderide.com/lgrlogo.png">
            </a>

            <ul class="nav nav-pills">
                <li class="nav-item"><a href="#home" class="nav-link" aria-current="page">Home</a></li>
                <li class="nav-item"><a href="#about" class="nav-link">About</a></li>
                <li class="nav-item"><a href="#contact" class="nav-link">Contact</a></li>
            </ul>
        </div>
    </header>

    <div class="hero px-4 py-5 text-center">
        <div class="container" style="z-index:1">
            <h1 class="display-5 fw-bold">Welcome to La Grande Ride</h1>
            <p class="fs-4 fw-light my-4">We develop recreation maps and provide outdoor recreation services.</p>
        </div>
    </div>

    <section id="about">
        <div class="container text-center">
            <h1 class="display-5 mb-5 fw-bold" style="color:#ab6f00">We are rebranding our site!</h1>
            <p class="fs-4">La Grande Ride is working on developing new recreation mapping and expanding our outdoor recreation services. Look for new updates in the months to come.</p>
        </div>
    </section>

    <section id="contact">
        <div class="container text-center">
            <h1 class="display-5 mb-5 fw-bold" style="color:#ab6f00">Contact Us</h1>
            <p class="fs-3 cntct"><i class="bi bi-envelope-at-fill"></i><a href="mailto:info@lagranderide.com">info@lagranderide.com</a></p>
            <p class="fs-3 cntct"><i class="bi bi-telephone-fill"></i><a href="tel:19152472633">915-247-2633</a></p>
        </div>
    </section>

    <footer>
        <div class="container">
            <p>&copy; <?=date('Y')?> La Grande Ride</p>
            <p class="mt-4" style="color:#f6f6f6;font-size:13px">Website and mapping developed by Brian Sather & Tesmond Hurd</p>
        </div>
    </footer>

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-V52PD3PV5X"></script>
    <script>window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-V52PD3PV5X');</script>
</body>
</html>