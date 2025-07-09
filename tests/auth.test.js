const request = require('supertest');
const app = require('../server');
const { User, Role } = require('../src/models');

describe('Authentication', () => {
  beforeEach(async () => {
    await User.destroy({ where: {} });
    await Role.destroy({ where: {} });
    
    // Create test role
    await Role.create({
      name: 'customer',
      description: 'Customer role',
      permissions: ['orders:read', 'orders:create']
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+237123456789'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toContain('Registration successful');
      expect(response.body.userId).toBeDefined();
    });

    it('should return validation errors for invalid data', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'weak',
        firstName: '',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });
});