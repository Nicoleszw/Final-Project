import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;        
  if (!header) return res.status(401).send('Sin token');

  const [, token] = header.split(' ');             
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;                           
    next();
  } catch (err) {
    res.status(401).send('Token inválido o expirado');
  }
}
