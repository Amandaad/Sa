<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $config = loadConfig();

    $timezone = new DateTimeZone($config['timezone'] ?? 'America/Sao_Paulo');
    $today = new DateTimeImmutable('now', $timezone);
    $todayKey = $today->format('Y-n-j');
    $todayDisplay = $today->format('d/m/Y');

    $isCli = PHP_SAPI === 'cli';
    if (!$isCli) {
        $token = $_GET['token'] ?? '';
        $expected = (string)($config['report_token'] ?? '');
        if ($expected !== '' && !hash_equals($expected, $token)) {
            http_response_code(401);
            echo json_encode(['error' => 'Token inválido.']);
            exit;
        }
    }

    $pdo = connectPdo($config);

    $stmt = $pdo->prepare('SELECT id, servico, preco, data_exibicao, hora, nome, phone, obs, status, created_at FROM agendamentos WHERE data_chave = :data_chave ORDER BY hora ASC, id ASC');
    $stmt->execute([':data_chave' => $todayKey]);
    $rows = $stmt->fetchAll();

    $to = (string)($config['report_email_to'] ?? '');
    $from = (string)($config['report_email_from'] ?? '');

    if ($to === '' || $from === '') {
        throw new RuntimeException('Defina report_email_to e report_email_from no config.php');
    }

    $subject = "Relatório de Agendamentos - {$todayDisplay}";

    $html = "<html><body style='font-family:Arial,sans-serif'>";
    $html .= "<h2>Relatório de Agendamentos - {$todayDisplay}</h2>";
    $html .= '<p>Total de agendamentos: <strong>' . count($rows) . '</strong></p>';

    if (count($rows) === 0) {
        $html .= '<p>Nenhum agendamento para hoje.</p>';
    } else {
        $html .= "<table border='1' cellpadding='8' cellspacing='0' style='border-collapse:collapse;font-size:14px'>";
        $html .= '<thead><tr style="background:#f3f3f3"><th>Hora</th><th>Cliente</th><th>Telefone</th><th>Serviço</th><th>Preço</th><th>Status</th><th>Observações</th></tr></thead><tbody>';

        foreach ($rows as $row) {
            $obs = trim((string)($row['obs'] ?? ''));
            $html .= '<tr>'
                . '<td>' . htmlspecialchars((string)$row['hora']) . '</td>'
                . '<td>' . htmlspecialchars((string)$row['nome']) . '</td>'
                . '<td>' . htmlspecialchars((string)$row['phone']) . '</td>'
                . '<td>' . htmlspecialchars((string)$row['servico']) . '</td>'
                . '<td>' . htmlspecialchars((string)$row['preco']) . '</td>'
                . '<td>' . htmlspecialchars((string)$row['status']) . '</td>'
                . '<td>' . htmlspecialchars($obs === '' ? '-' : $obs) . '</td>'
                . '</tr>';
        }

        $html .= '</tbody></table>';
    }

    $html .= "<p style='margin-top:16px;color:#666'>Sistema Studio AS</p>";
    $html .= '</body></html>';

    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: Studio AS <' . $from . '>',
    ];

    $ok = mail($to, $subject, $html, implode("\r\n", $headers));

    if (!$ok) {
        throw new RuntimeException('Falha ao enviar e-mail. Verifique SMTP/mail() no servidor PHP.');
    }

    echo json_encode([
        'success' => true,
        'date' => $todayDisplay,
        'total' => count($rows),
        'email_to' => $to,
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
}
