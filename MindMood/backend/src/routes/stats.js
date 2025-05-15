import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { pool } from '../services/db.js';

const router = Router();

/**
 * GET /stats?range=30d   where range = <number><unit>
 * unit = d (days) | w (weeks) | m (months) | y (years)
 * Example: 7d, 30d, 12w, 6m, 1y
 */
router.get('/', authenticate, async (req, res) => {
  const userId = req.user.id;
  const range  = (req.query.range || '30d').toLowerCase();

  // --- convert "30d" → SQL interval text "30 days"
  const match = range.match(/^(\d+)([dwmy])$/);
  if (!match) return res.status(400).send('Invalid range');

  const [ , num, unit ] = match;
  const unitMap = { d: 'days', w: 'weeks', m: 'months', y: 'years' };
  const intervalText = `${num} ${unitMap[unit]}`;

  const { rows } = await pool.query(
    `
    SELECT
      label,
      date_trunc('day', e.created_at) AS day,
      COUNT(*)                        AS qty
    FROM emotions e
    JOIN messages m ON m.id = e.message_id
    WHERE m.user_id = $1
      AND e.created_at >= NOW() - $2::interval
    GROUP BY label, day
    ORDER BY day;
    `,
    [userId, intervalText]
  );

  res.json(rows);        // [{ label:'joy', day:'2025-05-11', qty:2 }, …]
});

export default router;
