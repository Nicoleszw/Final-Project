import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../services/db.js';

const router = Router();

// ---------- SIGN-UP ----------
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send('Faltan email o password');
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
      [email, hash]
    );

    const token = jwt.sign(
      { id: result.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).send('Email ya registrado');
    }
    console.error(err);
    res.status(500).send('Error en el servidor');
  }
});

// ---------- LOGIN ----------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  if (!rows.length) {
    return res.status(401).send('Credenciales incorrectas');
  }

  const valido = await bcrypt.compare(password, rows[0].password_hash);
  if (!valido) {
    return res.status(401).send('Credenciales incorrectas');
  }

  const token = jwt.sign(
    { id: rows[0].id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token });
});

export default router;
