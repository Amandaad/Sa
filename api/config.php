<?php

// Copie para config.php e ajuste conforme seu phpMyAdmin/MySQL local.
return [
  'host' => '127.0.0.1',
  'port' => 3306,
  'dbname' => 'studio_as',
  'user' => 'root',
  'password' => '',
  'charset' => 'utf8mb4',

  // E-mail do relatório diário
  'report_email_to' => 'cursotiamanda@hotmail.com',
  'report_email_from' => 'no-reply@studioas.local',

  // Timezone usada para definir "dia atual"
  'timezone' => 'America/Sao_Paulo',

  // Token opcional para disparo HTTP seguro
  'report_token' => 'troque-este-token',
];
