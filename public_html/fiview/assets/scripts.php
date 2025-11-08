<?
ini_set('display_errors',1);
header('Content-type: text/'.($_GET['type']=='css' ? 'css' : 'javascript'));

session_start();
include('../config.inc.php');
$minify = true;

function shrink($t, $s, $b) {  
    global $disclaimer;

    if ($b) {  
        if ($t == 'css') {
            $o = $s;
            $regex = array('/\/\*(.|\n)*?\*\//', '/:([\s]+)/', '/([\s]+){/', '/([\s]{2,})/');
            $replace = array('', ':', '{', '');
            for ($i = 0; $i < count($regex); $i++) {
                $o = preg_replace($regex[$i], $replace[$i], $o);
            }
        } else if ($t == 'js') {
            $o = preg_replace('/(?:(?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:(?<!\:|\\\|\'|\")\/\/.*))/', '', $s);
            $o = str_replace(array(' ? ', ' : '), array('?', ':'), $o);

            $reg = array('/\' \+ ([A-Za-z]+) \+ \'/', '/\s\(([A-Za-z0-9.=\(\)]+)\)\s/', '/\s{2,}/', '/params\(([0-9]), \'([A-Za-z]+)\', ([A-Za-z0-9]+)\)/');
            $rep = array('\'+$1+\'', '($1)', '', 'params($1,\'$2\',$3)');

            for ($i = 0; $i < count($reg); $i++) {
                $o = preg_replace($reg[$i], $rep[$i], $o);
            }

            $o = str_replace(array('
    ', ' = ', ' === ', ' == ', '\' +', ' + ', '+ ', ': ', ' += ', '} else {', '} else if ', 'if (', ' / ', ' * ', ') {', ' < ', ' > ', ' && ', ' >= ', ' <= '),
                            array('', '=', '===', '==', '\'+', '+', '+', ':', '+=', '}else{', '}else if', 'if(', '/', '*', '){', '<', '>', '&&', '>=', '<='), $o);
        }

        $o = $disclaimer.$o;
    } else {
        $o = $s;
    }
    
    return $o;
}

#function compressCSS($css){
# $css = preg_replace('/\/\*[\s\S]+?\*\//', '', $css);
# $css = preg_replace('/;[\s\r\n\t]*?}[\s\r\n\t]*/ims', "}\r\n", $css);
# $css = preg_replace('/;[\s\r\n\t]*?([\r\n]?[^\s\r\n\t])/ims', ';$1', $css);
# $css = preg_replace('/[\s\r\n\t]*:[\s\r\n\t]*?([^\s\r\n\t])/ims', ':$1', $css);
# $css = preg_replace('/[\s\r\n\t]*,[\s\r\n\t]*?([^\s\r\n\t])/ims', ',$1', $css);
# $css = preg_replace('/[\s\r\n\t]*{[\s\r\n\t]*?([^\s\r\n\t])/ims', '{$1', $css);
# $css = preg_replace('/([\d\.]+)[\s\r\n\t]+(px|em|pt|%)/ims', '$1$2', $css);
# $css = preg_replace('/([^\d\.]0)(px|em|pt|%)/ims', '$1', $css);
# $css = preg_replace('/\p{Zs}+/ims',' ', $css);
# $css = str_replace(array("\r\n", "\r", "\n", '	'), '', $css);
# return $css;
#}

#function compressJS($js){
# $js = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $js);
# $js = preg_replace('/(?!\B\'[^\']*):\s(?![^\']*\'\B)/', ':', $js);
# $js =  preg_replace('/:\s([A-Za-z]+)/', ':$1', preg_replace('/:\s\'/', ':\'', $js));
# $js = str_replace(array("\r\n", "\r", "\n", "\t", '  ', '    ', '    '), '', $js);
# $js = str_replace(array(' + ',', ',' = ',' { ',' } ',' == ',') {','if (','} else {','} else if',' * ',' / ',' - ',' < ',' > ',' || ','; ',' != ',' ? ',' (',' !== ',' :',' >= ',' <= ',' && '), 
# array('+',',','=','{','}','==','){','if(','}else{','}else if','*','/','-','<','>','||',';','!=','?','(','!==',':','>=','<=','&&'), $js);
# $js = str_replace('&nbsp;(', ' (', $js);
  
# return $js;
#}

$disclaimer = '/* (c) '.date('Y').' '.$software_company.'
 * version '.str_replace(['.css','.js'], '', $_GET['version']).', minified
 * This software is considered proprietary software and no portion of this '.strtoupper($_GET['type']).' shall not be redistributed or reproduced without express written permission
 */
';
$filename = $_GET['version'].'/'.$_GET['file'];

if (!file_exists($filename)/*||!$_SESSION[uid]*/) {
    http_response_code(404);
} else {
    ob_start();
    echo file_get_contents($filename);
    echo shrink(($_GET['type'] == 'css' ? 'css' : 'js'), ob_get_clean(), $minify);
}
