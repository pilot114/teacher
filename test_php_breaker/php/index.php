<?php

function iterate(string $dir): RecursiveIteratorIterator
{
    return new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::LEAVES_ONLY
    );
}

function getCalls(string $filename, string $name): array
{
    $text = file_get_contents($filename);
    $pattern = "/\b$name\s*\(\s*[^;]*\)/";
    preg_match_all($pattern, $text, $matches);
    $calls = array_map(fn($s) => trim(preg_replace('/\s+/', ' ', $s)), $matches[0]);
    return array_unique($calls);
}

function checkBracketsPair(string $str): bool
{
    $stack = [];
    $brackets = [
        '(' => ')',
    ];

    for ($i = 0; $i < strlen($str); $i++) {
        $char = $str[$i];

        if (in_array($char, array_keys($brackets))) {
            // opening bracket
            array_push($stack, $char);
        } else if (in_array($char, array_values($brackets))) {
            // closing bracket
            $lastOpened = array_pop($stack);
            if ($lastOpened == null || $brackets[$lastOpened] != $char) {
                return false;
            }
        }
    }
    return count($stack) == 0;
}

function parseCall(array $tokens): array
{
    $typeToken = array_shift($tokens);
    preg_match_all("/\w+\(\s*(\w+),/", $typeToken, $matches);
    $type = $matches[1][0] ?? null;
    $str = '';
    foreach ($tokens as $token) {
        if (str_starts_with($token, ',')) {
            break;
        }
        if (str_starts_with($token, '"')) {
            $str .= $token;
        } elseif ($token !== ')') {
//            var_dump($token);
            $str .= "%s";
        }
    }
    $str = str_replace('\"', '@', $str);
    $str = str_replace('"', "", $str);
    $str = str_replace('@', '"', $str);
    $str = str_replace('%%', '%', $str);
    $str = str_replace('\n', '', $str);

    return [trim($type ?? ''), trim($str ?? '')];
}

function tokenize(string $string): array
{
    $pattern = '/"((?:\\\\.|[^"\\\\])*)"/';
    $matches = [];
    preg_match_all($pattern, $string, $matches);
    $parts = preg_split($pattern, $string);
    $result = [];
    foreach ($parts as $index => $part) {
        $result[] = $part;
        if (isset($matches[1][$index])) {
            $result[] = '"' . $matches[1][$index] . '"';
        }
    }
    return $result;
}

//    'zend_throw_error',
//function getZendThrowErrorList(string $dir) : array

function getZendErrorList(string $dir) : array
{
    $grouped = [];
    foreach (iterate($dir) as $r) {
        $filename = $r->getPathname();
        $calls = getCalls($filename, 'zend_error');
        foreach ($calls as $call) {
            [$type, $template] = parseCall(tokenize($call));
            if ($type && $template) {
                $grouped[$type][$template][] = str_replace($dir, '', $filename);
                $grouped[$type][$template] = array_unique($grouped[$type][$template]);
            }
        }
    }
    return $grouped;
}

$dir = './php-src/';
$data = getZendErrorList($dir);

header('Content-Type: application/json; charset=utf-8');
echo json_encode($data);
