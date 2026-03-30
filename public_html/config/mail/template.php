<!DOCTYPE html>
<html lang="en-US">

<head>
    <title>{emailTitle} | An email from MAPO LLC</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
        @import url('//fonts.googleapis.com/css2?family=Roboto:wght@200;400&display=swap');

        body {
            margin: 0;
            padding: 0;
            background-color: #f6f9fc;
            font-family: 'Roboto', Helvetica, sans-serif;
        }

        table {
            border-collapse: collapse;
            border-spacing: 0;
        }

        img {
            border: 0;
            outline: none;
            text-decoration: none;
            display: block;
        }

        a {
            color: #00a6ed;
            text-decoration: none;
        }

        p,
        span {
            line-height: 1.3;
        }

        a:hover {
            color: #00385c;
        }

        .container {
            width: 100%;
            max-width: 768px;
            margin: 0 auto;
            background: #ffffff;
        }

        .content {
            padding: 48px 24px;
            font-size: 16px;
            line-height: 1.6;
            color: #333;
        }

        .side-border {
            border: 1px solid #cad4db;
            border-top: 0;
            border-bottom: 0;
        }

        .top-border {
            border: 1px solid #cad4db;
            border-bottom: 0;
        }

        .bottom-border {
            border: 1px solid #cad4db;
            border-top: 0;
        }

        .footer {
            background: #2e2e2e;
            color: #ddd;
            text-align: center;
            padding: 32px 20px;
            font-size: 13px;
        }

        .footer a {
            color: #ef5350;
        }

        .muted {
            color: #aaa;
            font-size: 12px;
        }
    </style>
</head>

<body style="margin:0;background-color:#f6f9fc">

    <table style="width:100%;background-color:#f6f9fc;font-family:Roboto, 'Google Sans', helvetica, sans-serif" cellpadding="0" cellspacing="0">
        <tr>
            <td>
                <table style="width:100%;max-width:768px;background-color:#fff;margin:32px auto;" cellpadding="0" cellspacing="0">
                    <tr>
                        <td class="top-border" style="padding:32px;text-align:center">
                            <a href="//mapotechnology.com?utm_campaign=automated_emails&utm_source=email&utm_medium={template}" style="display:inline-block">
                                <img src="//mapotechnology.com/assets/images/mapo_logo_small.png" style="width:auto;max-width:100%;height:60px">
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td class="side-border" style="padding:0">
                            <hr style="margin:0;height:0;border:0;border-top:1px solid #edf0f3">
                        </td>
                    </tr>
                    <tr>
                        <td class="side-border" style="font-size:16px;padding:48px 16px;line-height:1.3">
                            {date}<br><br>

                            {message}<br><br>

                            {signature}
                        </td>
                    </tr>
                    <tr>
                        <td class="side-border" style="padding:32px 16px;text-align:center;font-size:14px;color:#f9f9f9;background-color:#2e2e2e">
                            <p style="padding-bottom:16px">&copy; {year} MAPO LLC</p>
                            <p style="line-height:1.4;font-size:14px;"><b>MAPO LLC</b><br>Headquartered in:<br>Summerville, OR 97876</p>
                            <span style="display:block;margin-top:32px;font-size:12px;color:#ddd">You received this email automatically by using a service from MAPO LLC.<br>
                                Please add <a style="color:#bbb" href="mailto:no-reply@mapotechnology.com">no-reply@mapotechnology.com</a> to your safe senders list.</span>
                        </td>
                    </tr>
                    <tr>
                        <td class="bottom-border" style="padding:0 16px 16px 16px;font-size:14px;text-align:center;color:#f9f9f9;background-color:#2e2e2e">
                            <a style="color:#ef5350;text-decoration:none;" href="https://www.mapotechnology.com/about/legal/terms">Terms</a> &middot;
                            <a style="color:#ef5350;text-decoration:none;" href="https://www.mapotechnology.com/about/legal/privacy">Privacy Policy</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

</body>

</html>