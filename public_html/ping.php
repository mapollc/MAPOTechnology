<?
header('Content-type: text/plain');

echo $_SERVER['REMOTE_ADDR'].'/'.$_SERVER['SERVER_ADDR'];