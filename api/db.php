<?php

declare(strict_types=1);

function loadConfig(): array
{
    $configPath = __DIR__ . '/config.php';
    if (!file_exists($configPath)) {
        throw new RuntimeException('Arquivo api/config.php não encontrado.');
    }

    $config = require $configPath;
    if (!is_array($config)) {
        throw new RuntimeException('Configuração inválida em api/config.php.');
    }

    return $config;
}

function connectPdo(array $config): PDO
{
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $config['host'],
        (int)$config['port'],
        $config['dbname'],
        $config['charset']
    );

    return new PDO($dsn, $config['user'], $config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
}
