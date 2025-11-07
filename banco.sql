CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL
);

CREATE TABLE Tutores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255) UNIQUE,
    endereco TEXT
);

CREATE TABLE Animais (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    especie VARCHAR(100) NOT NULL,
    raca VARCHAR(100),
    data_nascimento DATE,
    sexo VARCHAR(10),
   -- OBS: ON DELETE RESTRICT: Não deixa deletar um Tutor se ele tiver animais.
    id_tutor INT REFERENCES Tutores(id) ON DELETE RESTRICT  
);

CREATE TABLE Consultas (
    id SERIAL PRIMARY KEY,
    animal_id INT REFERENCES Animais(id) ON DELETE CASCADE,
    -- OBS: ON DELETE RESTRICT - Não deixa deletar um vet se ele tiver consultas)
    usuario_id INT REFERENCES Usuarios(id) ON DELETE RESTRICT,
    data_hora_agendamento TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Agendada',
    sintomas TEXT,
    tratamento_prescrito TEXT
);