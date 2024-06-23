import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import { supabase } from './lib/supabaseClient';

const app = express();
const port = 3001;

app.use(bodyParser.json());

interface User {
  name: string;
  email: string;
  password: string;
}

// Create a new user
app.post('/users', async (req: Request, res: Response) => {
  const { name, email, password } = req.body as User;

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password }]);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

// Get all users
app.get('/users', async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json(data);
});

// Get a user by ID
app.get('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json(data);
});

// Update a user by ID
app.put('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, password } = req.body as User;

  const { data, error } = await supabase
    .from('users')
    .update({ name, email, password })
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json(data);
});

// Delete a user by ID
app.delete('/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json(data);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
