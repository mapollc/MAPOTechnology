<?
$ext = $_REQUEST['folder'];
$file = $_REQUEST['file'];

header('Content-type: '.($ext=='js' ? 'text/javascript' : ($ext=='css' ? 'text/css' : ($ext=='json' ? 'application/json' : 'text'))));

function css($css){
 $css = preg_replace('/;[\s\r\n\t]*?}[\s\r\n\t]*/ims', "}\r\n", $css);
 $css = preg_replace('/;[\s\r\n\t]*?([\r\n]?[^\s\r\n\t])/ims', ';$1', $css);
 $css = preg_replace('/[\s\r\n\t]*:[\s\r\n\t]*?([^\s\r\n\t])/ims', ':$1', $css);
 $css = preg_replace('/[\s\r\n\t]*,[\s\r\n\t]*?([^\s\r\n\t])/ims', ',$1', $css);
 $css = preg_replace('/[\s\r\n\t]*{[\s\r\n\t]*?([^\s\r\n\t])/ims', '{$1', $css);
 $css = preg_replace('/([\d\.]+)[\s\r\n\t]+(px|em|pt|%)/ims', '$1$2', $css);
 $css = preg_replace('/([^\d\.]0)(px|em|pt|%)/ims', '$1', $css);
 $css = preg_replace('/\p{Zs}+/ims',' ', $css);
 $css = str_replace(array("	", "\r\n", "\r", "\n"), '', $css);
 return $css;
}

function js($js){
 $js = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $js);
 $js = preg_replace('/(?!\B\'[^\']*):\s(?![^\']*\'\B)/', ':', $js);
 $js =  preg_replace('/:\s([A-Za-z]+)/', ':$1', preg_replace('/:\s\'/', ':\'', $js));
 $js = str_replace(array("\r\n", "\r", "\n", "\t", '  ', '    ', '    '), '', $js);
 $js = str_replace(array(' + ',', ',' = ',' { ',' } ',' == ',') {','if (','} else {','} else if',' * ',' / ',' - ',' < ',' > ',' || ','; ',' != ',' ? ',' (',' !== ',' :',' >= ',' <= ',' && '), 
 array('+',',','=','{','}','==','){','if(','}else{','}else if','*','/','-','<','>','||',';','!=','?','(','!==',':','>=','<=','&&'), $js);

 return $js;
}

ob_start();
include_once('./'.$ext.'/'.$file.'.'.$ext);
echo ($ext == 'js'||$ext == 'json' ? js(ob_get_clean()) : ($ext == 'css' ? css(ob_get_clean()) : ob_get_clean()));
?>