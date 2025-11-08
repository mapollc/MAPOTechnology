<?
////ini_set('display_errors', 1);
////error_reporting(E_ALL);

function shrink($t, $s)
{
    if ($t == 'geojson') {
        $o = $s;
    } else if ($t == 'css') {
        /*// remove comments
        $o = preg_replace('/(?:(?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:(?<!\:|\\\|\'|\")\/\/.*))/m', '', $s);
        //$o = preg_replace('/\s*(?!<\")\/\*[^\*]+\*\/(?!\")\s*//*', '', $s);
        $o = str_replace(';;', ';', preg_replace('/([\s]+)(.*):\s(.*)/', '$2:$3;', $o));
        $o = preg_replace('/\n/', '', str_replace('{;', '{', preg_replace('/\s{/', '{', preg_replace('/\n}/', '}', $o))));
        $o = preg_replace('/\s{2,}/', '', $o);
        $regex = array('/\/\*(.|\n)*?\*\//', '/:([\s]+)/', '/([\s]+){/', '/([\s]{2,})/');
        $replace = array('', ':', '{', '');
        for ($i = 0; $i < count($regex); $i++) {
            $o = preg_replace($regex[$i], $replace[$i], $o);
        }
        $o = str_replace(',
', ',', preg_replace('/;\s;/', ';', $o));*/
        $o = preg_replace(
            array(
                // Remove comment(s)
                '#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')|\/\*(?!\!)(?>.*?\*\/)|^\s*|\s*$#s',
                // Remove unused white-space(s)
                '#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\'|\/\*(?>.*?\*\/))|\s*+;\s*+(})\s*+|\s*+([*$~^|]?+=|[{};,>~]|\s(?![0-9\.])|!important\b)\s*+|([[(:])\s++|\s++([])])|\s++(:)\s*+(?!(?>[^{}"\']++|"(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')*+{)|^\s++|\s++\z|(\s)\s+#si',
                // Replace `0(cm|em|ex|in|mm|pc|pt|px|vh|vw|%)` with `0`
                '#(?<=[\s:])(0)(cm|em|ex|in|mm|pc|pt|px|vh|vw|%)#si',
                // Replace `:0 0 0 0` with `:0`
                '#:(0\s+0|0\s+0\s+0\s+0)(?=[;\}]|\!important)#i',
                // Replace `background-position:0` with `background-position:0 0`
                '#(background-position):0(?=[;\}])#si',
                // Replace `0.6` with `.6`, but only when preceded by `:`, `,`, `-` or a white-space
                '#(?<=[\s:,\-])0+\.(\d+)#s',
                // Minify string value
                '#(\/\*(?>.*?\*\/))|(?<!content\:)([\'"])([a-z_][a-z0-9\-_]*?)\2(?=[\s\{\}\];,])#si',
                '#(\/\*(?>.*?\*\/))|(\burl\()([\'"])([^\s]+?)\3(\))#si',
                // Minify HEX color code
                '#(?<=[\s:,\-]\#)([a-f0-6]+)\1([a-f0-6]+)\2([a-f0-6]+)\3#i',
                // Replace `(border|outline):none` with `(border|outline):0`
                '#(?<=[\{;])(border|outline):none(?=[;\}\!])#',
                // Remove empty selector(s)
                '#(\/\*(?>.*?\*\/))|(^|[\{\}])(?:[^\s\{\}]+)\{\}#s'
            ),
            array(
                '$1',
                '$1$2$3$4$5$6$7',
                '$1',
                ':0',
                '$1:0 0',
                '.$1',
                '$1$3',
                '$1$2$4$5',
                '$1$2$3',
                '$1:0',
                '$1$2'
            ),
            $s
        );
    } else if ($t == 'js') {  
        /*$o = preg_replace('/(?:(?:\/\*(?:[^*]|(?:\*+[^*\/]))*\*+\/)|(?:(?<!\:|\\\|\'|\")\/\/.*))/m', '', $s);
        $o = str_replace(array(' ? ', ' : '), array('?', ':'), $o);

        $reg = array('/\' \+ ([A-Za-z]+) \+ \'/', '/\s\(([A-Za-z0-9.=\(\)]+)\)\s/', '/\s{2,}/', '/params\(([0-9]), \'([A-Za-z]+)\', ([A-Za-z0-9]+)\)/');
        $rep = array('\'+$1+\'', '($1)', '', 'params($1,\'$2\',$3)');

        for ($i = 0; $i < count($reg); $i++) {
            $o = preg_replace($reg[$i], $rep[$i], $o);
        }

        $o = str_replace(
            array('
', ' = ', ' === ', ' == ', '\' +', ' + ', '+ ', ': ', ' += ', '} else {', '} else if ', 'if (', ' / ', ' * ', ') {',
                ' < ', ' > ', ' && ', ' >= ', ' <= ', ' || ', ' != ', ' !== ', 'function ()', ' => {', '+\':\'+', ':\'+', '=> {', ', {'),
            array('', '=', '===', '==', '\'+', '+', '+', ':', '+=', '}else{', '}else if', 'if(', '/', '*', '){',
                '<', '>', '&&', '>=', '<=', '||', '!=', '!==', 'function()', '=>{', '+\': \'+', ': \'+', '=>{', ',{'),
            $o
        );

        $o = preg_replace('/\' \+\n\'/m', "'\+'", preg_replace('/\n/', '', preg_replace('/{\s(.*?)\s}/', '{$1}', preg_replace('/\'([A-Za-z0-9\s]+):\'/', '\'$1: \'', $o))));

        $o = preg_replace('/\'(.*?)(\',\s\')(.*?)\'/', "'$1','$3'", preg_replace('/\{"city":"(.*?)",\s"lat":"(.*?)",\s"lon":"(.*?)"\}/', "{\"city\":\"$1\",\"lat\":\"$2\",\"lon\":\"$3\"}", $o));*/
        
        include_once 'jsminify.inc.php';
        $min = new Minifier();
        $o = preg_replace('/(\s{2,}|\n)/', '', $min->minify($s));
    }

    return $o;
}

function minify_css($input)
{
    if (trim($input) === "") return $input;
    $r = preg_replace(
        array(
            // Remove comment(s)
            '#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')|\/\*(?!\!)(?>.*?\*\/)|^\s*|\s*$#s',
            // Remove unused white-space(s)
            '#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\'|\/\*(?>.*?\*\/))|\s*+;\s*+(})\s*+|\s*+([*$~^|]?+=|[{};,>~]|\s(?![0-9\.])|!important\b)\s*+|([[(:])\s++|\s++([])])|\s++(:)\s*+(?!(?>[^{}"\']++|"(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')*+{)|^\s++|\s++\z|(\s)\s+#si',
            // Replace `0(cm|em|ex|in|mm|pc|pt|px|vh|vw|%)` with `0`
            '#(?<=[\s:])(0)(cm|em|ex|in|mm|pc|pt|px|vh|vw|%)#si',
            // Replace `:0 0 0 0` with `:0`
            '#:(0\s+0|0\s+0\s+0\s+0)(?=[;\}]|\!important)#i',
            // Replace `background-position:0` with `background-position:0 0`
            '#(background-position):0(?=[;\}])#si',
            // Replace `0.6` with `.6`, but only when preceded by `:`, `,`, `-` or a white-space
            '#(?<=[\s:,\-])0+\.(\d+)#s',
            // Minify string value
            '#(\/\*(?>.*?\*\/))|(?<!content\:)([\'"])([a-z_][a-z0-9\-_]*?)\2(?=[\s\{\}\];,])#si',
            '#(\/\*(?>.*?\*\/))|(\burl\()([\'"])([^\s]+?)\3(\))#si',
            // Minify HEX color code
            '#(?<=[\s:,\-]\#)([a-f0-6]+)\1([a-f0-6]+)\2([a-f0-6]+)\3#i',
            // Replace `(border|outline):none` with `(border|outline):0`
            '#(?<=[\{;])(border|outline):none(?=[;\}\!])#',
            // Remove empty selector(s)
            '#(\/\*(?>.*?\*\/))|(^|[\{\}])(?:[^\s\{\}]+)\{\}#s'
        ),
        array(
            '$1',
            '$1$2$3$4$5$6$7',
            '$1',
            ':0',
            '$1:0 0',
            '.$1',
            '$1$3',
            '$1$2$4$5',
            '$1$2$3',
            '$1:0',
            '$1$2'
        ),
        $input
    );

    return str_replace([
        '@media (',
        ') and (',
        ') or ('
    ], [
        '@media(',
        ')and(',
        ')or('
    ], $r);
}

function minify_js($input)
{
    if (trim($input) === "") return $input;
    return preg_replace(
        array(
            // Remove comment(s)
            '#\s*("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\')\s*|\s*\/\*(?!\!|@cc_on)(?>[\s\S]*?\*\/)\s*|\s*(?<![\:\=])\/\/.*(?=[\n\r]|$)|^\s*|\s*$#',
            // Remove white-space(s) outside the string and regex
            '#("(?:[^"\\\]++|\\\.)*+"|\'(?:[^\'\\\\]++|\\\.)*+\'|\/\*(?>.*?\*\/)|\/(?!\/)[^\n\r]*?\/(?=[\s.,;]|[gimuy]|$))|\s*([!%&*\(\)\-=+\[\]\{\}|;:,.<>?\/])\s*#s',
            // Remove the last semicolon
            '#;+\}#',
            // Minify object attribute(s) except JSON attribute(s). From `{'foo':'bar'}` to `{foo:'bar'}`
            '#([\{,])([\'])(\d+|[a-z_][a-z0-9_]*)\2(?=\:)#i',
            // --ibid. From `foo['bar']` to `foo.bar`
            '#([a-z0-9_\)\]])\[([\'"])([a-z_][a-z0-9_]*)\2\]#i'
        ),
        array(
            '$1',
            '$1$2',
            '}',
            '$1$3',
            '$1.$3',
            '-'
        ),
        $input
    );
}

/*function shrink($type, $string) {
    if ($type == 'css') {
        return minify_css($string);
    } else if ($type == 'js') {
        return minify_js($string);
    }
}*/
$vm = date('ymd.H.i', $filemod);
$versioning = $_GET['version'] ? $_GET['version'].' ('.$vm.')' : 'version '.$vm;
$copyright = '/* (c) ' . date('Y') . ' MAPO LLC | ' . str_replace(['.css', '.js'], '', $versioning) . ', ' . (!$minify ? 'un' : '') . 'minified
 * No portion of this ' . strtoupper($_GET['type']) . ' may be copied, redistributed, or reproduced without express written permission from MAPO LLC
 */
';

$contents = file_get_contents($root);
echo ($_GET['type'] != 'geojson' ? $copyright : '') . ($minify ? shrink($_GET['type'], $contents) : $contents);

//https://gist.github.com/Rodrigo54/93169db48194d470188f