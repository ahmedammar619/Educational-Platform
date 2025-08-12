-- Seed roles
INSERT INTO roles (id, name) VALUES
  (uuid_generate_v4(), 'ADMIN'),
  (uuid_generate_v4(), 'FINANCE'),
  (uuid_generate_v4(), 'SUPERVISOR'),
  (uuid_generate_v4(), 'SUPPORT'),
  (uuid_generate_v4(), 'TEACHER'),
  (uuid_generate_v4(), 'PARENT'),
  (uuid_generate_v4(), 'STUDENT')
ON CONFLICT (name) DO NOTHING;

-- Seed basic permissions (illustrative subset)
INSERT INTO permissions (name, description) VALUES
  ('user.read', 'Read users'),
  ('user.write', 'Create/Update users'),
  ('class.read', 'Read classes'),
  ('class.write', 'Create/Update classes'),
  ('content.read', 'Read contents'),
  ('content.write', 'Create/Update contents'),
  ('finance.read', 'Read invoices/payments'),
  ('finance.write', 'Create/Update invoices/payments'),
  ('report.read', 'View reports')
ON CONFLICT (name) DO NOTHING;

-- Map ADMIN all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p WHERE r.name = 'ADMIN'
ON CONFLICT DO NOTHING;

-- Map TEACHER typical permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.name IN ('class.read','class.write','content.read','content.write','report.read')
WHERE r.name = 'TEACHER'
ON CONFLICT DO NOTHING;

-- Create initial admin user (password hash should be replaced)
INSERT INTO users (email, password_hash, first_name, last_name)
VALUES ('admin@ban.local', '$2a$10$wzX.qW8ty9B2l0m8Z9G6UOx1hV9q3dXb8m0yJbNwZy8Hj1oWvB0te', 'System', 'Admin')
ON CONFLICT (email) DO NOTHING;

-- Assign ADMIN role to admin user
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@ban.local' AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;


