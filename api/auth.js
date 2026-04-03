const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const JWT_SECRET = 'affiliate-platform-secret-key-2024';
const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

function readDB() {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = req.url;
  
  // Registro
  if (req.method === 'POST' && url === '/register') {
    const { name, email, password, role } = req.body;
    const db = readDB();
    
    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: password, // Em produção, usar bcrypt
      role: role || 'seller',
      totalSales: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    writeDB(db);
    
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.json({ user: userWithoutPassword, token });
  }
  
  // Login
  else if (req.method === 'POST' && url === '/login') {
    const { email, password } = req.body;
    const db = readDB();
    
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ user: userWithoutPassword, token });
  }
  
  // Verificar token
  else if (req.method === 'GET' && url === '/verify') {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      res.json({ valid: true, user: decoded });
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  }
  
  else {
    res.status(404).json({ error: 'Rota não encontrada' });
  }
};
