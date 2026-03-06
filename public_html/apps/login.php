<!DOCTYPE html>
<html lang="en-US">

<head>
    <title><?= $thisApp->name() ?> - MAPO LLC</title>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=1">
    <link rel="shortcut icon" href="//mapotechnology.com/assets/images/favicon.ico" type="image/x-icon" />
    <link rel="apple-touch-icon" sizes="120x120" href="../assets/images/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="../assets/images/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="../assets/images/favicon-16x16.png">
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Roboto:wght@200;400&display=swap">
    <link href="//mapotechnology.com/src/css/global.css" rel="stylesheet">
    <link href="//mapotechnology.com/src/css/auth.css" rel="stylesheet">
</head>

<body>

    <main>
        <div class="wrapper">
            <a href="https://www.mapotechnology.com" class="logo"><img style="width:inherit" src="//mapotechnology.com/assets/images/mapo_logo_small.png"></a>
            <h1>Login to <?= $thisApp->name() ?></h1>

            <div class="message error">Accessing <?= $thisApp->name() ?> requires authentication.</div>

            <p style="margin:2em 0;line-height:1.5;text-align:center">Please login to your account first. You can login to all of MAPO's apps and services 
                from one account using our single sign-on (SSO).</p>

            <a class="btn btn-blue btn-lg" style="display:block;margin:25px auto 0 auto" href="//auth.mapotechnology.com/login?service=apps&prod=<?= $thisApp->url() ?>&next=<?= urlencode($_SERVER['REQUEST_URI']) ?>">Login</a>
            <p class="or">or</p>
            <a style="display:block;text-align:center" href="//auth.mapotechnology.com/register?service=apps&prod=<?= $thisApp->url() ?>&next=<?= urlencode($_SERVER['REQUEST_URI']) ?>">Create an account</a>
        </div>
    </main>

</body>

</html>