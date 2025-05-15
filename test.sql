SELECT id, email, created_at
FROM users
ORDER BY id DESC;

SELECT id, email, password_hash
FROM users
ORDER BY id DESC;

SELECT id, email, password_hash FROM users WHERE email = 'nicoleszw23@gmail.com';


SELECT m.id,
       u.email,
       m.content,
       m.created_at,
	   m.session_id
FROM   messages m
JOIN   users u ON u.id = m.user_id
WHERE  m.role = 'user'
ORDER  BY m.created_at DESC
LIMIT  20;


ALTER TABLE emotions
  DROP CONSTRAINT emotions_label_check;

ALTER TABLE emotions
  ADD  CONSTRAINT emotions_label_check
  CHECK (label IN ('joy','sadness','anger','fear','surprise','neutral'));
  
SELECT * FROM emotions 

ALTER TABLE messages ADD COLUMN session_id UUID DEFAULT gen_random_uuid();
