<?php
/**
 * 簡易環境變數載入器
 * 會讀取專案根目錄下的 .env 檔案並將設定寫入 getenv/$_ENV/$_SERVER。
 */
class Env
{
    /**
     * 載入指定路徑的 .env 檔案。
     */
    public static function load($path)
    {
        if (!is_file($path) || !is_readable($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || strpos($line, '#') === 0) {
                continue;
            }

            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) {
                continue;
            }

            $name = trim($parts[0]);
            $value = trim($parts[1]);

            if ($name === '') {
                continue;
            }

            $value = self::stripQuotes($value);

            if (!array_key_exists($name, $_ENV)) {
                $_ENV[$name] = $value;
            }
            if (!array_key_exists($name, $_SERVER)) {
                $_SERVER[$name] = $value;
            }
            putenv(sprintf('%s=%s', $name, $value));
        }
    }

    private static function stripQuotes($value)
    {
        if ($value === '') {
            return $value;
        }

        $first = substr($value, 0, 1);
        $last = substr($value, -1);
        if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
            return substr($value, 1, -1);
        }

        return $value;
    }
}

if (!function_exists('env')) {
    function env($key, $default = null)
    {
        $value = getenv($key);
        if ($value === false) {
            return $default;
        }
        $trimmed = trim($value);
        if ($trimmed === '') {
            return $default;
        }
        return $trimmed;
    }
}
if (!function_exists(''env_bool'')) {
    function env_bool($key, $default = true)
    {
        $value = env($key, null);
        if ($value === null) {
            return $default;
        }

        $normalized = strtolower(trim($value));
        if ($normalized === ''1'' || $normalized === ''true'' || $normalized === ''yes'' || $normalized === ''on'') {
            return true;
        }
        if ($normalized === ''0'' || $normalized === ''false'' || $normalized === ''no'' || $normalized === ''off'') {
            return false;
        }
        return $default;
    }
}
