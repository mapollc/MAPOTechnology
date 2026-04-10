<?
date_default_timezone_set('America/Los_Angeles');

function minify_css($input)
{
    if (trim($input) === "") return $input;
    $r = preg_replace(
        [
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
        ],
        [
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
        ],
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

/*function minify_js($input)
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
}*/

/*function shrink($type, $string) {
    if ($type == 'css') {
        return minify_css($string);
    } else if ($type == 'js') {
        return minify_js($string);
    }
}*/

function shrink($t, $s)
{
    switch ($t) {
        case 'geojson':
            return $s;
        case 'css':
            return minify_css($s);
        case 'js':
            include_once 'jsminify.inc.php';
            $minifier = new Minifier();
            return preg_replace('/(\s{2,}|\n)/', '', $minifier->minify($s));
    }
}

/*$memcache = new Memcached();
$memcache->addServer('127.0.0.1', 11211);*/

$vm = date('ymd.H.i', $filemod);

/*$cacheKey = md5("{$file}{$version}");
$timeKey = "$cacheKey-time";

$cache = $memcache->get($cacheKey);
$cacheTime = $memcache->get($timeKey);
$minifyFileTime = filemtime('/home/mapo/public_html/config/minifier.inc.php');

$needsRebuild = $cache === false || $cacheTime === false || $filemod > $cacheTime || $minifyFileTime > $cacheTime;*/
$versioning = $version ? "$version ($vm)" : "version $vm";

$copyright = "/* (c) " . date('Y') . " MAPO LLC | " . str_replace(['.css', '.js'], '', $versioning) . ", " . (!$minify ? 'un' : '') . "minified
 * No portion of this " . strtoupper($type) . " may be copied, redistributed, or reproduced without express written permission from MAPO LLC
 */
";

echo $type != 'geojson' ? $copyright : '';

/*if ($needsRebuild) {*/
    $contents = file_get_contents($root);
    /*$memcache->set($cacheKey, $contents, 3600);
    $memcache->set($timeKey, time(), 3600);
} else {
    $contents = $cache;
}*/

echo $minify ? shrink($type, $contents) : $contents;

//https://gist.github.com/Rodrigo54/93169db48194d470188f