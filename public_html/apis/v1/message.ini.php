<?
if ($_REQUEST['fname'] != '' && $_REQUEST['lname'] != '' && $_REQUEST['email'] != '' && $_REQUEST['subject'] != 'Reason for message' && $_REQUEST['msg'] != '') {
    $name = $_REQUEST['fname'] ? $_REQUEST['fname'].($_REQUEST['lname'] ? ' '.$_REQUEST['lname'] : '') : '';
    $message = $_REQUEST['msg'] . (isset($_REQUEST['app_details']) ? '<br><br><b><i>'.$_REQUEST['app_details'].'</b></i>' : '');
    $fields = array('contact' => 1, '{name}' => $name, '{email}' => $_REQUEST['email'], '{subject}' => $_REQUEST['subject'], '{message}' => $message, '{ip}' => $_REQUEST['ip'], '{host}' => $_REQUEST['host']);

    if (sendEmail('info@mapotechnology.com', 'Website Visitor Contact Form: '.$_REQUEST['subject'], 'contact', $fields)) {
        $o = array('success' => 1);
    } else {
        $o = array('error' => 1);
    }
} else {
    $o = array('error' => 2);
}

$returnJson = $o;