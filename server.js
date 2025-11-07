import express from 'express';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

app.post('/usuarios', async (req, res) => {
    try {
        const { nome, email, senha, perfil } = req.body;
        
        const result = await pool.query(
            'INSERT INTO Usuarios (nome, email, senha, perfil) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, perfil',
            [nome, email, senha, perfil]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.get('/tutores', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Tutores');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar tutores:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.post('/tutores', async (req, res) => {
    try {
        const { nome, cpf, telefone, email, endereco } = req.body;
        const result = await pool.query(
            'INSERT INTO Tutores (nome, cpf, telefone, email, endereco) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nome, cpf, telefone, email, endereco]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar tutor:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.get('/animais', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, t.nome as tutor_nome 
            FROM Animais a 
            JOIN Tutores t ON a.id_tutor = t.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar animais:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Versão sem JOIN - retorna apenas os dados dos animais
app.get('/animais/simples', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Animais');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar animais:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.post('/animais', async (req, res) => {
    try {
        const { nome, especie, raca, data_nascimento, sexo, id_tutor } = req.body;
        const result = await pool.query(
            'INSERT INTO Animais (nome, especie, raca, data_nascimento, sexo, id_tutor) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [nome, especie, raca, data_nascimento, sexo, id_tutor]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar animal:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.get('/consultas', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT c.*, 
                   a.nome as animal_nome,
                   t.nome as tutor_nome,
                   u.nome as veterinario_nome
            FROM Consultas c
            JOIN Animais a ON c.animal_id = a.id
            JOIN Tutores t ON a.id_tutor = t.id
            JOIN Usuarios u ON c.usuario_id = u.id
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar consultas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Versão sem JOIN - retorna apenas os dados básicos das consultas
app.get('/consultas/simples', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Consultas');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar consultas:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.post('/consultas', async (req, res) => {
    try {
        const { animal_id, usuario_id, data_hora_agendamento, sintomas } = req.body;

        const conflito = await pool.query(
            'SELECT * FROM Consultas WHERE data_hora_agendamento = $1',
            [data_hora_agendamento]
        );

        if (conflito.rows.length > 0) {
            return res.status(400).json({ 
                message: 'Já existe uma consulta agendada para este horário',
                conflito: conflito.rows[0]
            });
        }

        const result = await pool.query(
            'INSERT INTO Consultas (animal_id, usuario_id, data_hora_agendamento, sintomas) VALUES ($1, $2, $3, $4) RETURNING *',
            [animal_id, usuario_id, data_hora_agendamento, sintomas]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao criar consulta:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.patch('/consultas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, tratamento_prescrito } = req.body;

        const result = await pool.query(
            'UPDATE Consultas SET status = $1, tratamento_prescrito = $2 WHERE id = $3 RETURNING *',
            [status, tratamento_prescrito, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Consulta não encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar consulta:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

app.get('/animais/:id/historico', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT c.*, u.nome as veterinario_nome
            FROM Consultas c
            JOIN Usuarios u ON c.usuario_id = u.id
            WHERE c.animal_id = $1
            ORDER BY c.data_hora_agendamento DESC
        `, [id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Versão sem JOIN - retorna apenas as consultas do animal
app.get('/animais/:id/historico/simples', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM Consultas WHERE animal_id = $1 ORDER BY data_hora_agendamento DESC',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});