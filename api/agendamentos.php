<?php

declare(strict_types=1);

require __DIR__ . '/db.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

try {
  $config = loadConfig();
  $pdo = connectPdo($config);

  $method = $_SERVER['REQUEST_METHOD'];

  if ($method === 'GET') {
    $stmt = $pdo->query('SELECT id, servico, emoji, preco, data_exibicao, data_chave, hora, nome, phone, obs, status, google_event_id, created_at FROM agendamentos ORDER BY created_at DESC');
    $rows = array_map(static function (array $row): array {
      return [
        'id' => (int)$row['id'],
        'servico' => $row['servico'],
        'emoji' => $row['emoji'],
        'preco' => $row['preco'],
        'data' => $row['data_exibicao'],
        'dataKey' => $row['data_chave'],
        'hora' => $row['hora'],
        'nome' => $row['nome'],
        'phone' => $row['phone'],
        'obs' => $row['obs'] ?? '',
        'status' => $row['status'],
        'googleEventId' => $row['google_event_id'] ?: null,
        'createdAt' => $row['created_at'],
      ];
    }, $stmt->fetchAll());

    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
    exit;
  }

  if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    $required = ['servico', 'emoji', 'preco', 'data', 'dataKey', 'hora', 'nome', 'phone', 'status'];
    foreach ($required as $field) {
      if (!isset($input[$field]) || trim((string)$input[$field]) === '') {
        http_response_code(422);
        echo json_encode(['error' => "Campo obrigatório ausente: {$field}"]);
        exit;
      }
    }

    $stmt = $pdo->prepare('INSERT INTO agendamentos (servico, emoji, preco, data_exibicao, data_chave, hora, nome, phone, obs, status, google_event_id) VALUES (:servico, :emoji, :preco, :data_exibicao, :data_chave, :hora, :nome, :phone, :obs, :status, :google_event_id)');
    $stmt->execute([
      ':servico' => $input['servico'],
      ':emoji' => $input['emoji'],
      ':preco' => $input['preco'],
      ':data_exibicao' => $input['data'],
      ':data_chave' => $input['dataKey'],
      ':hora' => $input['hora'],
      ':nome' => $input['nome'],
      ':phone' => $input['phone'],
      ':obs' => $input['obs'] ?? '',
      ':status' => $input['status'],
      ':google_event_id' => $input['googleEventId'] ?? null,
    ]);

    $id = (int)$pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
      'id' => $id,
      'servico' => $input['servico'],
      'emoji' => $input['emoji'],
      'preco' => $input['preco'],
      'data' => $input['data'],
      'dataKey' => $input['dataKey'],
      'hora' => $input['hora'],
      'nome' => $input['nome'],
      'phone' => $input['phone'],
      'obs' => $input['obs'] ?? '',
      'status' => $input['status'],
      'googleEventId' => $input['googleEventId'] ?? null,
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }

  if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    if ($id <= 0) {
      http_response_code(422);
      echo json_encode(['error' => 'ID inválido para exclusão.']);
      exit;
    }

    $stmt = $pdo->prepare('DELETE FROM agendamentos WHERE id = :id');
    $stmt->execute([':id' => $id]);

    echo json_encode(['success' => true]);
    exit;
  }

  http_response_code(405);
  echo json_encode(['error' => 'Método não permitido.']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Erro interno na API.', 'details' => $e->getMessage()]);
}
