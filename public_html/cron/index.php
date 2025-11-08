<?
header('Content-type: application/json');

echo json_encode(array('error' => 403, 'message' => 'Access to this server is forbidden'));